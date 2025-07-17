# This overall script processes a text file to compute a generational score based 
# on the similarity of the input text to a predefined "Gen Z" text. It includes 
# three main steps: flattening and cleaning the input text, lemmatizing the words, 
# and calculating the cosine similarity using TF-IDF vectorization.


# STEP 1: INPUT FLATTENER AND CLEANER
# This script reads a text file, removes non-alphabetic characters, and flattens

import re
import sys

import json
import re
from flask import Flask, request
from flask_cors import CORS
import nltk
nltk.download('wordnet')
nltk.download('punkt_tab')
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = Flask(__name__)
count = 0
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

def lemmatize_text(text):
    lemmatizer = WordNetLemmatizer()
    tokens = nltk.word_tokenize(text)
    lemmatized = [lemmatizer.lemmatize(token) for token in tokens]
    return ' '.join(lemmatized)

@app.route('/analyze', methods=['POST'])
# the text into a single string for further processing.
def analyze():

    data = request.get_json()
    text = data['content']
    generation = data['generation']

    print("Received text for analysis:", text[1:20])
    print("Received generation for analysis:", generation)
    

    all_text = []
    for line in text.splitlines():
        words = re.findall(r'[a-zA-Z]+', line)
        words = [word.lower() for word in words]
        all_text.extend(words)

    flattened = ' '.join(all_text)

    model = SentenceTransformer('all-MiniLM-L6-v2')

    lemmatized_text = lemmatize_text(flattened)

    with open("lemmatized_millennial.txt", 'r', encoding='utf-8') as f:
        millennial_text = f.read()

    with open("lemmatized_genz.txt", "r", encoding="utf-8") as f:
        genz_text = f.read()

    with open("lemmatized_boomer.txt", "r", encoding="utf-8") as f:
        boomer_text = f.read()

    genz_embedding = model.encode([genz_text])
    millennial_embedding = model.encode([millennial_text])
    boomer_embedding = model.encode([boomer_text])
    input_embedding = model.encode([lemmatized_text])

    genz_vector = np.mean(genz_embedding, axis=0).reshape(1, -1)
    millennial_vector = np.mean(millennial_embedding, axis=0).reshape(1, -1)
    boomer_vector = np.mean(boomer_embedding, axis=0).reshape(1, -1)
    
    genz_similarity = 0.0
    boomer_similarity = 0.0
    millennial_similarity = 0.0

    if generation == "gen-z":
        boomer_similarity = str(round(cosine_similarity(boomer_vector, input_embedding)[0][0] * 100, 2))
        return json.dumps({"similarity": boomer_similarity})

    if generation == "boomers":
        boomer_similarity = str(round(cosine_similarity(boomer_vector, input_embedding)[0][0] * 100, 2))
        return json.dumps({"similarity": boomer_similarity})

    if generation == "millennial":
        millennial_similarity = str(round(cosine_similarity(millennial_vector, input_embedding)[0][0] * 100, 2))
        print("Millennial similarity:", millennial_similarity)
        return json.dumps({"similarity": millennial_similarity}) 

    # print("Cosine similarity with Gen Z reference:", genz_similarity)
    # print("Cosine similarity with Millennial reference:", millennial_similarity)
    # print("Cosine similarity with Boomer reference:", boomer_similarity)

if __name__ == "__main__":
    app.run(debug=True)
