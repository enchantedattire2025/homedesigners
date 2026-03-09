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
  testMode?: boolean;
  testPhone?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { projectId, notificationType, customMessage, testMode, testPhone }: NotificationRequest = await req.json();

    console.log("Received request:", { projectId, notificationType, testMode, testPhone });

    if (!notificationType) {
      return new Response(
        JSON.stringify({ error: "Missing required field: notificationType" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!testMode && !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: projectId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (testMode && !testPhone) {
      return new Response(
        JSON.stringify({ error: "Test phone number is required in test mode" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : "";

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let isServiceRole = false;

    if (token === supabaseServiceKey) {
      isServiceRole = true;
    } else if (token) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        if (!testMode) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    } else if (!testMode) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
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

    console.log("WhatsApp settings:", { settings, error: settingsError });

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch WhatsApp settings", details: settingsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!settings) {
      console.log("WhatsApp settings not configured");
      return new Response(
        JSON.stringify({ error: "WhatsApp settings not configured", skipped: true }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!settings.is_enabled) {
      console.log("WhatsApp notifications are not enabled");
      return new Response(
        JSON.stringify({ message: "WhatsApp notifications are not enabled", skipped: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let project: any = null;

    if (testMode) {
      project = {
        id: projectId || "test-project",
        name: "Test Customer",
        project_name: "Test Project",
        phone: testPhone,
        user_id: null,
        assignment_status: "pending",
        assigned_designer: null,
      };
      console.log("Using test mode with mock project data");
    } else {
      const { data: projectData, error: projectError } = await supabase
        .from("customers")
        .select("*, assigned_designer:designers(name)")
        .eq("id", projectId)
        .maybeSingle();

      console.log("Project lookup:", { projectData, error: projectError });

      if (projectError) {
        console.error("Error fetching project:", projectError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch project", details: projectError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (!projectData) {
        return new Response(
          JSON.stringify({ error: "Project not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      project = projectData;
    }

    if (!testMode) {
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

    let formattedPhone: string;

    if (testMode && testPhone) {
      const cleanTestPhone = testPhone.replace(/[^0-9+]/g, "");
      formattedPhone = cleanTestPhone;

      if (!cleanTestPhone.startsWith("+")) {
        if (cleanTestPhone.startsWith("91")) {
          formattedPhone = `+${cleanTestPhone}`;
        } else if (cleanTestPhone.length === 10) {
          formattedPhone = `+91${cleanTestPhone}`;
        } else {
          formattedPhone = `+${cleanTestPhone}`;
        }
      }
    } else {
      const phoneNumber = project.phone.replace(/[^0-9+]/g, "");
      formattedPhone = phoneNumber;

      if (!phoneNumber.startsWith("+")) {
        if (phoneNumber.startsWith("91")) {
          formattedPhone = `+${phoneNumber}`;
        } else if (phoneNumber.length === 10) {
          formattedPhone = `+91${phoneNumber}`;
        } else {
          formattedPhone = `+${phoneNumber}`;
        }
      }
    }

    const logId = crypto.randomUUID();

    if (!testMode) {
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
      console.log("Created notification log:", logId);
    } else {
      console.log("Test mode: skipping notification log creation");
    }

    if (settings.provider === "waha") {
      const wahaApiUrl = settings.waha_api_url;
      const wahaSession = settings.waha_session || "default";
      const wahaApiKey = settings.waha_api_key;

      if (!wahaApiUrl) {
        await supabase
          .from("whatsapp_notification_logs")
          .update({
            status: "failed",
            error_message: "WAHA API URL not configured",
            failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);

        return new Response(
          JSON.stringify({ error: "WAHA API URL not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const wahaUrl = `${wahaApiUrl}/api/sendText`;
      const wahaHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (wahaApiKey) {
        wahaHeaders["X-Api-Key"] = wahaApiKey;
      }

      const chatId = formattedPhone.replace("+", "") + "@c.us";

      console.log("Sending to WAHA:", {
        url: wahaUrl,
        session: wahaSession,
        chatId,
        hasApiKey: !!wahaApiKey
      });

      const wahaResponse = await fetch(wahaUrl, {
        method: "POST",
        headers: wahaHeaders,
        body: JSON.stringify({
          session: wahaSession,
          chatId: chatId,
          text: messageBody,
        }),
      });

      console.log("WAHA response status:", wahaResponse.status);

      let wahaData;
      try {
        wahaData = await wahaResponse.json();
        console.log("WAHA response data:", wahaData);
      } catch (e) {
        console.error("Failed to parse WAHA response:", e);
        const responseText = await wahaResponse.text();
        console.log("WAHA response text:", responseText);
        wahaData = { error: "Failed to parse response", rawResponse: responseText };
      }

      if (wahaResponse.ok) {
        if (!testMode) {
          await supabase
            .from("whatsapp_notification_logs")
            .update({
              status: "sent",
              provider_message_id: wahaData.id || wahaData.messageId || logId,
              provider_status: "sent",
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", logId);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "WhatsApp notification sent successfully via WAHA",
            messageId: wahaData.id || wahaData.messageId,
            testMode,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        if (!testMode) {
          await supabase
            .from("whatsapp_notification_logs")
            .update({
              status: "failed",
              error_message: JSON.stringify(wahaData),
              failed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", logId);
        }

        console.error("WAHA API error:", wahaData);

        return new Response(
          JSON.stringify({
            error: "Failed to send WhatsApp notification via WAHA",
            details: wahaData,
            debugInfo: {
              url: wahaUrl,
              session: wahaSession,
              chatId,
              status: wahaResponse.status,
            },
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      if (!testMode) {
        await supabase
          .from("whatsapp_notification_logs")
          .update({
            status: "failed",
            error_message: "Unsupported provider - only WAHA is supported",
            failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", logId);
      }

      return new Response(
        JSON.stringify({ error: "Unsupported WhatsApp provider - only WAHA is supported" }),
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
