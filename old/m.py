import os
import urllib.request
import requests
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Updater, CommandHandler, MessageHandler, Filters, CallbackQueryHandler

API = os.environ['Your_Telegram_Bot_API']
URL = os.environ['https://astonishing-torte-0e6602.netlify.app']
BOT_TOKEN = os.environ['Your_Bot_Token']
CHANNEL_ID = os.environ['Update_Channel_ID']
BIN_CHANNEL_ID = os.environ['Bin_Channel_ID']
UPDATES_CHANNEL_ID = os.environ['Updates_Channel_ID']
PORT = int(os.environ.get('PORT', '8443'))


def start(update, context):
    context.bot.send_message(chat_id=update.effective_chat.id, text="Welcome to the File to Link Bot. Send me a file and I'll convert it to a high-speed downloadable and streamable link.")
    
def convert_file(update, context):
    # Check if the message contains a file
    if len(update.message.document) == 0:
        context.bot.send_message(chat_id=update.effective_chat.id, text="Please send a file.")
        return
    
    file = update.message.document.file_name
    file_size = update.message.document.file_size
    file_id = update.message.document.file_id
    
    #convert file into downloadable and streamable links
    download_url = f"{URL}/{API}/{BOT_TOKEN}/getFile?file_id={file_id}"
    r = requests.get(download_url)
    file_path = r.json()['result']['file_path']
    streamable_link = f"https://astonishing-torte-0e6602.netlify.app/{file_path}"
    download_link = f"https://astonishing-torte-0e6602.netlify.app/{file_path}"