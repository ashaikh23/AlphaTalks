# This overall script processes a text file to compute a generational score based 
# on the similarity of the input text to predefined generational texts (Gen Z, Millennial, and Boomer). It includes 
# three main steps: flattening and cleaning the input text, lemmatizing the words, 
# and calculating the cosine similarity using TF-IDF vectorization.


# STEP 1: INPUT FLATTENER AND CLEANER
# This script reads a text file, removes non-alphabetic characters, and flattens

import re
import sys

if len(sys.argv) < 2:
    print("Usage: python text_to_scores.py <input_txt_path>")
    sys.exit(1)

input_path = sys.argv[1]

all_text = []

with open(input_path, 'r', encoding='utf-8') as f:
    for line in f:
        # Remove non-alphabetic characters, keep spaces, and split into words
        words = re.findall(r'[a-zA-Z]+', line)
        words = [word.lower() for word in words]
        all_text.extend(words)

# Join all words into one line, separated by single spaces
flattened = ' '.join(all_text)

with open("flattened_input.txt", 'w', encoding='utf-8') as out:
    out.write(flattened)
# print(f"Flattened text written to {output_path}")

# STEP 2: TEXT LEMMATIZER
# This script reads the text, lemmatizes the words, and writes the lemmatized text to a new file.
import json
import re
import nltk
nltk.download('wordnet')
nltk.download('punkt_tab')
from nltk.stem import WordNetLemmatizer

def lemmatize_text(text):
    lemmatizer = WordNetLemmatizer()
    tokens = nltk.word_tokenize(text)
    lemmatized = [lemmatizer.lemmatize(token) for token in tokens]
    return ' '.join(lemmatized)

# Take flattened text and lemmatize whole thing (it is one line)
lemmatized_text = lemmatize_text(flattened)
# Save to file
with open("lemmatized_input.txt", 'w', encoding='utf-8') as out:
    out.write(lemmatized_text)
# print("Lemmatized text written to lemmatized_input.txt")

# STEP 3: TF-IDF VECTORIZER AND COSINE SIMILARITY
# This script reads the lemmatized text, creates a TF-IDF vectorizer, and
# computes the cosine similarity between the lemmatized gen Z text, millennial text, boomer text, and the input text.

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Read the lemmatized gen Z text
with open("lemmatized_genz.txt", "r", encoding="utf-8") as f:
    genz_text = f.read()

# Read the lemmatized millennial text
with open("lemmatized_millennial.txt", "r", encoding="utf-8") as f:
    millennial_text = f.read()

# Read the lemmatized boomer text
with open("lemmatized_boomer.txt", "r", encoding="utf-8") as f:
    boomer_text = f.read()

# The input lemmatized text is already in lemmatized_text

# Prepare documents for comparison
# [reference, input]
genz_documents = [genz_text, lemmatized_text]
millennial_documents = [millennial_text, lemmatized_text]
boomer_documents = [boomer_text, lemmatized_text]

# TF-IDF and cosine similarity for Gen Z
vectorizer_genz = TfidfVectorizer()
tfidf_matrix_genz = vectorizer_genz.fit_transform(genz_documents)
genz_similarity = cosine_similarity(tfidf_matrix_genz[0:1], tfidf_matrix_genz[1:2])[0][0]

# TF-IDF and cosine similarity for Millennial
vectorizer_millennial = TfidfVectorizer()
tfidf_matrix_millennial = vectorizer_millennial.fit_transform(millennial_documents)
millennial_similarity = cosine_similarity(tfidf_matrix_millennial[0:1], tfidf_matrix_millennial[1:2])[0][0]

# TF-IDF and cosine similarity for Boomer
vectorizer_boomer = TfidfVectorizer()
tfidf_matrix_boomer = vectorizer_boomer.fit_transform(boomer_documents)
boomer_similarity = cosine_similarity(tfidf_matrix_boomer[0:1], tfidf_matrix_boomer[1:2])[0][0]

print("Cosine similarity with Gen Z reference:", genz_similarity)
print("Cosine similarity with Millennial reference:", millennial_similarity)
print("Cosine similarity with Boomer reference:", boomer_similarity)
