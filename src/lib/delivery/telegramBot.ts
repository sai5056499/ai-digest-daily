import TelegramBot from "node-telegram-bot-api";
import { logger } from "@/lib/utils/logger";
import type { Article } from "@/lib/database/firebase";

let bot: TelegramBot | null = null;

function getBot(): TelegramBot | null {
  if (bot) return bot;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn(
      "TELEGRAM_BOT_TOKEN not set. Telegram notifications disabled. " +
        "Create a bot via @BotFather on Telegram to get a token."
    );
    return null;
  }

  bot = new TelegramBot(token, { polling: false });
  return bot;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

/**
 * Send top articles to a Telegram channel or chat.
 */
export async function sendToTelegram(
  articles: Article[],
  chatId?: string
): Promise<number> {
  const telegramBot = getBot();
  if (!telegramBot) return 0;

  const targetChat =
    chatId || process.env.TELEGRAM_CHAT_ID;
  if (!targetChat) {
    logger.warn(
      "TELEGRAM_CHAT_ID not set. Cannot send Telegram messages. " +
        "Add your chat/channel ID to .env"
    );
    return 0;
  }

  const topArticles = [...articles]
    .sort((a, b) => (b.ai_importance || 0) - (a.ai_importance || 0))
    .slice(0, 5);

  let sentCount = 0;

  // Send header message
  try {
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    await telegramBot.sendMessage(
      targetChat,
      `🤖 *AI & Tech Daily — ${escapeMarkdown(today)}*\n\nTop stories from today:`,
      { parse_mode: "MarkdownV2" }
    );
  } catch (error) {
    logger.error(`Telegram header failed: ${(error as Error).message}`);
  }

  // Send each article
  for (const article of topArticles) {
    try {
      const importanceEmoji =
        (article.ai_importance || 5) >= 8
          ? "🔥"
          : (article.ai_importance || 5) >= 6
            ? "⭐"
            : "📌";

      const tags = (article.ai_tags || [])
        .slice(0, 3)
        .map((t) => `\\#${escapeMarkdown(t)}`)
        .join(" ");

      const message = [
        `${importanceEmoji} *${escapeMarkdown(article.title)}*`,
        "",
        article.ai_summary
          ? escapeMarkdown(article.ai_summary)
          : "",
        "",
        `📰 ${escapeMarkdown(article.source)} \\| ⭐ ${article.ai_importance || 5}/10`,
        tags ? `🏷️ ${tags}` : "",
        "",
        `[Read More](${article.link})`,
      ]
        .filter(Boolean)
        .join("\n");

      await telegramBot.sendMessage(targetChat, message, {
        parse_mode: "MarkdownV2",
        disable_web_page_preview: false,
      });

      sentCount++;

      // Rate limit between messages
      await new Promise((r) => setTimeout(r, 1500));
    } catch (error) {
      logger.error(
        `Telegram send failed for "${article.title}": ${(error as Error).message}`
      );
    }
  }

  logger.info(`Telegram: ${sentCount} messages sent to ${targetChat}`);
  return sentCount;
}

/**
 * Send a simple text notification to Telegram.
 */
export async function sendTelegramNotification(
  message: string
): Promise<boolean> {
  const telegramBot = getBot();
  if (!telegramBot) return false;

  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return false;

  try {
    await telegramBot.sendMessage(chatId, message);
    return true;
  } catch (error) {
    logger.error(`Telegram notification failed: ${(error as Error).message}`);
    return false;
  }
}
