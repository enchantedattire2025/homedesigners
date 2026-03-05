import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  projectId: string;
  notificationType: string;
  customMessage?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { projectId, notificationType, customMessage }: NotificationRequest = await req.json();

    if (!projectId || !notificationType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: projectId, notificationType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from("whatsapp_settings")
      .select("*")
      .maybeSingle();

    if (settingsError || !settings || !settings.is_enabled) {
      console.log("WhatsApp notifications are not enabled");
      return new Response(
        JSON.stringify({ message: "WhatsApp notifications are not enabled", skipped: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("customers")
      .select("*, assigned_designer:designers(name)")
      .eq("id", projectId)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: preferences, error: preferencesError } = await supabase
      .from("customer_notification_preferences")
      .select("*")
      .eq("customer_id", projectId)
      .maybeSingle();

    if (preferencesError || !preferences || !preferences.whatsapp_enabled) {
      console.log("Customer has disabled WhatsApp notifications");
      return new Response(
        JSON.stringify({ message: "Customer has disabled notifications", skipped: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const notificationTypeMap: Record<string, keyof typeof preferences> = {
      "quote_generated": "notify_quote_generated",
      "quote_accepted": "notify_quote_accepted",
      "status_update": "notify_status_update",
      "project_update": "notify_project_update",
      "team_assigned": "notify_team_assigned",
      "project_completed": "notify_project_completed",
    };

    const preferenceKey = notificationTypeMap[notificationType];
    if (preferenceKey && !preferences[preferenceKey]) {
      console.log(`Customer has disabled ${notificationType} notifications`);
      return new Response(
        JSON.stringify({ message: "Notification type disabled by customer", skipped: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let messageBody = customMessage || "";
    if (!customMessage) {
      const projectName = project.project_name || "Your Project";
      const designerName = project.assigned_designer?.name || "Your Designer";

      switch (notificationType) {
        case "quote_generated":
          messageBody = `Hello ${project.name}! 🎉\n\nA new quotation has been generated for your project "${projectName}".\n\nPlease log in to your account to review and accept the quote.\n\nThank you!\nThe Home Designers Team`;
          break;
        case "quote_accepted":
          messageBody = `Hello ${project.name}! ✅\n\nYour quotation for project "${projectName}" has been accepted.\n\nWork will begin soon. We'll keep you updated on the progress.\n\nThank you!\nThe Home Designers Team`;
          break;
        case "status_update":
          messageBody = `Hello ${project.name}! 📊\n\nProject "${projectName}" status has been updated to: ${project.assignment_status || 'Updated'}.\n\nLog in to your account to see the latest details.\n\nThank you!\nThe Home Designers Team`;
          break;
        case "project_update":
          messageBody = `Hello ${project.name}! 📸\n\n${designerName} has added a new update to your project "${projectName}".\n\nCheck your account to see the latest photos and progress.\n\nThank you!\nThe Home Designers Team`;
          break;
        case "team_assigned":
          messageBody = `Hello ${project.name}! 👥\n\nA new team member has been assigned to your project "${projectName}".\n\nLog in to see the updated team details.\n\nThank you!\nThe Home Designers Team`;
          break;
        case "project_completed":
          messageBody = `Hello ${project.name}! 🎊\n\nCongratulations! Your project "${projectName}" has been marked as completed.\n\nThank you for choosing The Home Designers. We hope you love your new space!\n\nPlease share your feedback with us.\n\nBest regards,\nThe Home Designers Team`;
          break;
        default:
          messageBody = `Hello ${project.name}! 📢\n\nThere's an update on your project "${projectName}".\n\nLog in to your account for more details.\n\nThank you!\nThe Home Designers Team`;
      }
    }

    const phoneNumber = project.phone.replace(/[^0-9+]/g, "");
    let formattedPhone = phoneNumber;

    if (!phoneNumber.startsWith("+")) {
      if (phoneNumber.startsWith("91")) {
        formattedPhone = `+${phoneNumber}`;
      } else if (phoneNumber.length === 10) {
        formattedPhone = `+91${phoneNumber}`;
      } else {
        formattedPhone = `+${phoneNumber}`;
      }
    }

    const logId = crypto.randomUUID();
    await supabase
      .from("whatsapp_notification_logs")
      .insert({
        id: logId,
        project_id: projectId,
        customer_id: projectId,
        user_id: project.user_id,
        notification_type: notificationType,
        phone_number: formattedPhone,
        message_body: messageBody,
        status: "pending",
      });

    if (settings.provider === "twilio") {
      const accountSid = settings.account_sid;
      const authToken = settings.auth_token;
      const fromNumber = settings.from_number;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = btoa(`${accountSid}:${authToken}`);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:${formattedPhone}`,
          Body: messageBody,
        }),
      });

      const twilioData = await twilioResponse.json();

      if (twilioResponse.ok) {
        await supabase
          .from("whatsapp_notification_logs")
          .update({
            status: "sent",
            provider_message_id: twilioData.sid,
            provider_status: twilioData.status,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);

        return new Response(
          JSON.stringify({
            success: true,
            message: "WhatsApp notification sent successfully",
            messageId: twilioData.sid,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        await supabase
          .from("whatsapp_notification_logs")
          .update({
            status: "failed",
            error_message: JSON.stringify(twilioData),
            failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);

        return new Response(
          JSON.stringify({
            error: "Failed to send WhatsApp notification",
            details: twilioData,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      await supabase
        .from("whatsapp_notification_logs")
        .update({
          status: "failed",
          error_message: "Unsupported provider",
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", logId);

      return new Response(
        JSON.stringify({ error: "Unsupported WhatsApp provider" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error sending WhatsApp notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
