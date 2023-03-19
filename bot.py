import os
import urllib.request
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackQueryHandler

TOKEN = 'your_bot_token'
PORT = int(os.environ.get('PORT', '8443'))

def start(update, context):
    context.bot.send_message(chat_id=update.effective_chat.id, text="Welcome to the File Converter Bot. Send me a file and I'll convert it to a high-speed downloadable and streamable link.")

def convert_file(update, context):
    # Check if the message contains a file
    if len(update.message.document) == 0:
        context.bot.send_message(chat_id=update.effective_chat.id, text="Please send a file.")
        return
    
    file = update.message.document.file_name
    file_size = update.message.document.file_size
    file_id = update.message.document.file_id
    
    # Convert file into downloadable and streamable links
    download_url = f"https://api.telegram.org/bot{TOKEN}/getFile?file_id={file_id}"
    r = requests.get(download_url)
    file_path = r.json()['result']['file_path']
    streamable_link = f"https://your_netlify_site_url/{file_path}"
    download_link = f"https://your_netlify_site_url/{file_path}"
    
    # Send the links to the user
    message = f"File Name: {file}\nHere are the links for your video:\n\n📦File Size: {file_size}\n💌Download link: {download_link}\n💻Watch online: {streamable_link}\n\n♻️ THIS LINK IS PERMANENT AND WILL NOT EXPIRE ♻️"
    keyboard = [[InlineKeyboardButton("⚡DOWLOAD⚡", url=download_link), InlineKeyboardButton("⚡WATCH⚡", url=streamable_link)]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    context.bot.send_message(chat_id=update.effective_chat.id, text=message, reply_markup=reply_markup)
    
def main():
    updater = Updater(TOKEN, use_context=True)
    dp = updater.dispatcher
    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(MessageHandler(Filters.document, convert_file))
    updater.start_webhook(listen="0.0.0.0", port=PORT, url_path=TOKEN)
    updater.bot.setWebhook(url=f"https://your_netlify_site_url/{TOKEN}")
    updater.idle()

if __name__ == '__main__':
    main()
