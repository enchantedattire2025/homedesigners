/*
  # Fix Ambiguous Column References in Quota Validation Functions

  ## Changes
  - Rename variables to avoid conflicts with column names
  - Use v_ prefix for all local variables to prevent ambiguity
*/

-- Fix get_designer_current_usage function with renamed variables
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
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_status text;
  v_plan_name text;
  v_max_quotes integer;
  v_max_projects integer;
  v_quotes_used integer;
  v_projects_used integer;
BEGIN
  -- Get current month period
  v_period_start := date_trunc('month', now());
  v_period_end := date_trunc('month', now()) + interval '1 month';

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
    v_status,
    v_plan_name,
    v_max_quotes,
    v_max_projects
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
      v_period_start,
      v_period_end;
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
    v_period_start,
    v_period_end,
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
    v_quotes_used,
    v_projects_used
  FROM subscription_usage_tracking sut
  WHERE sut.designer_subscription_id = v_subscription_id
    AND sut.period_start = v_period_start;

  -- Return result
  RETURN QUERY SELECT 
    p_designer_id,
    v_status,
    v_plan_name,
    v_max_quotes,
    v_max_projects,
    v_quotes_used,
    v_projects_used,
    GREATEST(0, v_max_quotes - COALESCE(v_quotes_used, 0))::integer,
    GREATEST(0, v_max_projects - COALESCE(v_projects_used, 0))::integer,
    v_period_start,
    v_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix increment_designer_quote_usage function with renamed variables
CREATE OR REPLACE FUNCTION increment_designer_quote_usage(p_designer_id uuid)
RETURNS void AS $$
DECLARE
  v_subscription_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  -- Get current month period
  v_period_start := date_trunc('month', now());
  v_period_end := date_trunc('month', now()) + interval '1 month';

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
    v_period_start,
    v_period_end,
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
