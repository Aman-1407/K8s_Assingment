function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("No POST data").setMimeType(ContentService.MimeType.TEXT);
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError);
      return ContentService.createTextOutput("Invalid JSON").setMimeType(ContentService.MimeType.TEXT);
    }

    // 🔹 Only keep Critical & Warning alerts /
    const alerts = (payload.alerts || []).filter(a => {
      const sev = (a.labels?.severity || "").toLowerCase();
      return sev === "critical" || sev === "warning";
    });

    if (alerts.length === 0) {
      return ContentService.createTextOutput("No critical/warning alerts").setMimeType(ContentService.MimeType.TEXT);
    }

    const firing = alerts.filter(a => a.status === "firing");
    const resolved = alerts.filter(a => a.status === "resolved");

    let messageBlocks = [];

    if (firing.length > 0) {
      messageBlocks.push(formatSection("🔥 *Firing Alerts:*", firing));
    }
    if (resolved.length > 0) {
      messageBlocks.push(formatSection("✅ *Resolved Alerts:*", resolved));
    }

    const text = messageBlocks.join("\n\n" + "─".repeat(40) + "\n\n");

    // 🔹 Send to Google Chat
    const chatWebhookUrl = "https://chat.googleapis.com/v1/spaces/AAQAzeIZQbs/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=Apa7HxTySiCf-mw9NeW6dKtBTeyOXssgVEF6S5lUju8";
    UrlFetchApp.fetch(chatWebhookUrl, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify({ text }),
      muteHttpExceptions: true
    });

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    console.error("Unexpected error:", err);
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.TEXT);
  }
}

function formatSection(title, alerts) {
  let block = [title];
  alerts.forEach(alert => {
    const labels = alert.labels || {};
    const annotations = alert.annotations || {};
    
    // Determine the correct filter based on section title
    const filterState = title.includes("Firing") ? "state:firing" : "state:inactive";
    const alertname = labels.alertname || "Unknown Alert";
    
    // Create URL with both state and alertname filters
    const newurl = `https://grafana.bigbash.store/alerting/list?search=${filterState}%20${encodeURIComponent(alertname)}`;
    
    const severity = (labels.severity || "unknown").toUpperCase();
    const namespace = labels.namespace || "default";
    const pod = labels.pod || "N/A";
    const container = labels.container || "N/A";
    const description = annotations.description || annotations.summary || "No description available";

    const started = alert.startsAt || "N/A";
    const resolvedAt = alert.endsAt || "";

    const runbookUrl = annotations.runbook_url || "";

    // 🔹 Build annotation dump
    let annotationText = "";
    Object.keys(annotations).forEach(k => {
      annotationText += `    • ${k}: ${annotations[k]}\n`;
    });

    block.push(
      `• *Alert:* ${alertname}`,
      `  *Severity:* ${severity}`,
      `  *Namespace:* ${namespace}`,
      `  *Pod:* ${pod}`,
      `  *Container:* ${container}`,
      `  *Description:* ${description}`,
      started && title.includes("Resolved") ? `  *Resolved At:* ${formatTimestamp(resolvedAt)}` : `  *Started:* ${formatTimestamp(started)}`,
      newurl ? `  📊 *Grafanaurl*: ${newurl}` : `  📊 Grafanaurl: N/A`,
      ""
    );
  });
  return block.join("\n");
}

function formatTimestamp(timestamp) {
  if (!timestamp || timestamp === "N/A") return "N/A";
  try {
    return new Date(timestamp).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  } catch (e) {
    return timestamp;
  }
}
