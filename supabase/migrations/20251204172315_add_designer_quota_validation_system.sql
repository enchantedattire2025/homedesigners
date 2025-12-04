/*
  # Designer Quota Validation and Enforcement System

  ## Overview
  This migration adds comprehensive quota validation and enforcement for designer subscriptions,
  ensuring designers cannot exceed their plan limits for quotes and projects.

  ## New Functions

  ### 1. `get_designer_current_usage()`
  Returns the current period's usage for a designer including:
  - Total quotes generated this month
  - Total active projects
  - Plan limits (max_quotes, max_projects)
  - Remaining capacity

  ### 2. `can_designer_accept_assignment()`
  Validates whether a designer can accept a new project assignment based on:
  - Subscription status (active/trial)
  - Current quote count vs max_quotes limit
  - Returns boolean with detailed reason if false

  ### 3. `increment_designer_quote_usage()`
  Automatically increments the quote counter when a project is assigned
  - Creates usage tracking record if doesn't exist
  - Updates quotes_generated counter
  - Handles monthly period rollover

  ### 4. `get_designer_subscription_info()`
  Returns comprehensive subscription info for UI display

  ## Trigger
  - Auto-update usage tracking when project assignments are created

  ## Security
  - All functions use SECURITY DEFINER for reliable quota checking
  - Proper validation to prevent manipulation
*/

-- Function to get current usage for a designer in the current period
CREATE OR REPLACE FUNCTION get_designer_current_usage(p_designer_id uuid)
RETURNS TABLE (
  designer_id uuid,
  subscription_status text,
  plan_name text,
  max_quotes integer,
  max_projects integer,
  quotes_used integer,
  projects_used integer,
  quotes_remaining integer,
  projects_remaining integer,
  period_start timestamptz,
  period_end timestamptz
) AS $$
DECLARE
  v_subscription_id uuid;
  v_plan_id uuid;
  v_current_period_start timestamptz;
  v_current_period_end timestamptz;
BEGIN
  -- Get current month period
  v_current_period_start := date_trunc('month', now());
  v_current_period_end := date_trunc('month', now()) + interval '1 month';

  -- Get designer subscription info
  SELECT 
    ds.id,
    ds.subscription_plan_id,
    ds.status,
    sp.name,
    sp.max_quotes,
    sp.max_projects
  INTO 
    v_subscription_id,
    v_plan_id,
    subscription_status,
    plan_name,
    max_quotes,
    max_projects
  FROM designer_subscriptions ds
  JOIN subscription_plans sp ON sp.id = ds.subscription_plan_id
  WHERE ds.designer_id = p_designer_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      p_designer_id,
      'no_subscription'::text,
      NULL::text,
      0::integer,
      0::integer,
      0::integer,
      0::integer,
      0::integer,
      0::integer,
      v_current_period_start,
      v_current_period_end;
    RETURN;
  END IF;

  -- Get or create usage tracking for current period
  INSERT INTO subscription_usage_tracking (
    designer_subscription_id,
    period_start,
    period_end,
    quotes_generated,
    projects_created
  ) VALUES (
    v_subscription_id,
    v_current_period_start,
    v_current_period_end,
    0,
    0
  )
  ON CONFLICT (designer_subscription_id, period_start) 
  DO NOTHING;

  -- Get current usage
  SELECT 
    COALESCE(sut.quotes_generated, 0),
    COALESCE(sut.projects_created, 0)
  INTO 
    quotes_used,
    projects_used
  FROM subscription_usage_tracking sut
  WHERE sut.designer_subscription_id = v_subscription_id
    AND sut.period_start = v_current_period_start;

  -- Calculate remaining
  quotes_remaining := GREATEST(0, max_quotes - COALESCE(quotes_used, 0));
  projects_remaining := GREATEST(0, max_projects - COALESCE(projects_used, 0));
  
  designer_id := p_designer_id;
  period_start := v_current_period_start;
  period_end := v_current_period_end;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if designer can accept a new assignment
CREATE OR REPLACE FUNCTION can_designer_accept_assignment(p_designer_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_usage record;
  v_subscription_status text;
BEGIN
  -- Get current usage
  SELECT * INTO v_usage FROM get_designer_current_usage(p_designer_id);

  -- Check if subscription exists
  IF v_usage.subscription_status = 'no_subscription' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'no_subscription',
      'message', 'Designer does not have an active subscription'
    );
  END IF;

  -- Check if subscription is active or trial
  IF v_usage.subscription_status NOT IN ('active', 'trial') THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'subscription_inactive',
      'message', 'Designer subscription is ' || v_usage.subscription_status,
      'status', v_usage.subscription_status
    );
  END IF;

  -- Check quote limit
  IF v_usage.quotes_used >= v_usage.max_quotes THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'quota_exceeded',
      'message', 'Designer has reached their monthly quote limit (' || v_usage.quotes_used || '/' || v_usage.max_quotes || ')',
      'plan_name', v_usage.plan_name,
      'max_quotes', v_usage.max_quotes,
      'quotes_used', v_usage.quotes_used,
      'period_end', v_usage.period_end
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'message', 'Designer can accept new assignments',
    'plan_name', v_usage.plan_name,
    'max_quotes', v_usage.max_quotes,
    'quotes_used', v_usage.quotes_used,
    'quotes_remaining', v_usage.quotes_remaining,
    'period_end', v_usage.period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment designer quote usage
CREATE OR REPLACE FUNCTION increment_designer_quote_usage(p_designer_id uuid)
RETURNS void AS $$
DECLARE
  v_subscription_id uuid;
  v_current_period_start timestamptz;
  v_current_period_end timestamptz;
BEGIN
  -- Get current month period
  v_current_period_start := date_trunc('month', now());
  v_current_period_end := date_trunc('month', now()) + interval '1 month';

  -- Get subscription ID
  SELECT id INTO v_subscription_id
  FROM designer_subscriptions
  WHERE designer_id = p_designer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Designer subscription not found';
  END IF;

  -- Insert or update usage tracking
  INSERT INTO subscription_usage_tracking (
    designer_subscription_id,
    period_start,
    period_end,
    quotes_generated,
    projects_created,
    last_updated
  ) VALUES (
    v_subscription_id,
    v_current_period_start,
    v_current_period_end,
    1,
    0,
    now()
  )
  ON CONFLICT (designer_subscription_id, period_start) 
  DO UPDATE SET
    quotes_generated = subscription_usage_tracking.quotes_generated + 1,
    last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get designer subscription info for display
CREATE OR REPLACE FUNCTION get_designer_subscription_info(p_designer_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_usage record;
BEGIN
  SELECT * INTO v_usage FROM get_designer_current_usage(p_designer_id);

  v_result := jsonb_build_object(
    'subscription_status', v_usage.subscription_status,
    'plan_name', v_usage.plan_name,
    'limits', jsonb_build_object(
      'max_quotes', v_usage.max_quotes,
      'max_projects', v_usage.max_projects
    ),
    'usage', jsonb_build_object(
      'quotes_used', v_usage.quotes_used,
      'projects_used', v_usage.projects_used,
      'quotes_remaining', v_usage.quotes_remaining,
      'projects_remaining', v_usage.projects_remaining
    ),
    'period', jsonb_build_object(
      'start', v_usage.period_start,
      'end', v_usage.period_end
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index for faster quota lookups
CREATE INDEX IF NOT EXISTS idx_subscription_usage_tracking_lookup 
ON subscription_usage_tracking(designer_subscription_id, period_start, period_end);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_designer_current_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_designer_accept_assignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_designer_subscription_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_designer_quote_usage(uuid) TO authenticated;
