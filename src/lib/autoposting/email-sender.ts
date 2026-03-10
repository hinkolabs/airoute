import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface AutopostingEmailPayload {
  to: string;
  brand_name: string;
  topic: string;
  blog_content: string;
  sns_content: string;
  image_urls?: string[];
  from?: string;
}

function buildEmailHtml(payload: AutopostingEmailPayload): string {
  const { brand_name, topic, blog_content, sns_content, image_urls } = payload;

  const imageSection =
    image_urls && image_urls.length > 0
      ? `
    <div style="margin: 24px 0;">
      <p style="font-size:13px;color:#6b7280;margin-bottom:8px;">이미지</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${image_urls
          .map(
            (url) =>
              `<img src="${url}" alt="콘텐츠 이미지" style="width:240px;height:160px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />`
          )
          .join("")}
      </div>
    </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${topic}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#1e1b4b;padding:20px 32px;">
              <p style="margin:0;color:#a5b4fc;font-size:12px;font-weight:600;letter-spacing:0.05em;">AUTO POSTING</p>
              <h1 style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:700;">${brand_name}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <!-- Topic -->
              <div style="margin-bottom:24px;padding:16px;background:#f5f3ff;border-radius:8px;border-left:4px solid #7c3aed;">
                <p style="margin:0;font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:4px;">이번 회차 주제</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:#1f2937;">${topic}</p>
              </div>

              <!-- Blog Content -->
              <div style="margin-bottom:32px;">
                <p style="font-size:13px;color:#6b7280;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">📝 블로그 / 이메일용</p>
                <div style="font-size:15px;color:#1f2937;line-height:1.7;white-space:pre-wrap;">${blog_content}</div>
              </div>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

              <!-- SNS Content -->
              <div style="margin-bottom:24px;">
                <p style="font-size:13px;color:#6b7280;font-weight:600;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.05em;">📱 SNS용</p>
                <div style="background:#f9fafb;border-radius:8px;padding:16px;font-size:14px;color:#1f2937;line-height:1.6;white-space:pre-wrap;">${sns_content}</div>
              </div>

              ${imageSection}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                AIRoute Auto Posting으로 자동 생성됨 · <a href="https://airoute.co.kr" style="color:#7c3aed;text-decoration:none;">airoute.co.kr</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAutopostingEmail(
  payload: AutopostingEmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fromAddress =
    payload.from ?? `${payload.brand_name} via AIRoute <noreply@airoute.co.kr>`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: payload.to,
      subject: `[${payload.brand_name}] ${payload.topic}`,
      html: buildEmailHtml(payload),
    });

    if (error) {
      console.error("[email-sender] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error("[email-sender] Unexpected error:", err?.message);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
