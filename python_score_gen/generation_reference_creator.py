# INPUT FLATTENER AND CLEANER
# This script reads a text file, removes non-alphabetic characters, and flattens

import re
import sys
import nltk
from nltk.stem import WordNetLemmatizer

# Download NLTK data if not already present
nltk.download('punkt')
nltk.download('wordnet')

if len(sys.argv) < 3:
    print("Usage: python generation_reference_creator.py <input_txt_path> <insert_name>")
    sys.exit(1)

input_path = sys.argv[1]
insert_name = sys.argv[2]
output_path = f"lemmatized_{insert_name}.txt"

all_text = []

with open(input_path, 'r', encoding='utf-8') as f:
    for line in f:
        # Remove non-alphabetic characters, keep spaces, and split into words
        words = re.findall(r'[a-zA-Z]+', line)
        words = [word.lower() for word in words]
        all_text.extend(words)

# Join all words into one line, separated by single spaces
flattened = ' '.join(all_text)

def lemmatize_text(text):
    lemmatizer = WordNetLemmatizer()
    tokens = nltk.word_tokenize(text)
    lemmatized = [lemmatizer.lemmatize(token) for token in tokens]
    return ' '.join(lemmatized)

lemmatized_text = lemmatize_text(flattened)

with open(output_path, 'w', encoding='utf-8') as out:
    out.write(lemmatized_text)

print(f"Lemmatized text written to {output_path}")
