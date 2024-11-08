from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import spacy
from spacy.tokens import DocBin
import json
import os

class ResumeML:
    def __init__(self):
        """Initialize the ML models and resources"""
        # Create directories if they don't exist
        os.makedirs('./models', exist_ok=True)
        os.makedirs('./data', exist_ok=True)

        # Load BERT model for semantic similarity
        try:
            self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            self.model = AutoModel.from_pretrained('bert-base-uncased')
        except Exception as e:
            print(f"Error loading BERT model: {str(e)}")
            self.tokenizer = None
            self.model = None
        
        # Load spaCy model
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            print(f"Error loading spaCy model: {str(e)}")
            self.nlp = None
        
        # Load skill embeddings
        self.skill_embeddings = self.load_skill_embeddings()

    def get_bert_embedding(self, text):
        """Get BERT embeddings for text"""
        if self.tokenizer is None or self.model is None:
            return np.zeros((1, 768))  # Return zero vector if models aren't loaded
        
        try:
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            with torch.no_grad():
                outputs = self.model(**inputs)
            return outputs.last_hidden_state.mean(dim=1).numpy()
        except Exception as e:
            print(f"Error getting BERT embedding: {str(e)}")
            return np.zeros((1, 768))

    def load_skill_embeddings(self):
        """Load pre-computed skill embeddings"""
        try:
            if os.path.exists('./data/skill_embeddings.json'):
                with open('./data/skill_embeddings.json', 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading skill embeddings: {str(e)}")
        return {}

    def compute_skill_similarity(self, skill1, skill2):
        """Compute semantic similarity between skills"""
        try:
            if skill1 not in self.skill_embeddings:
                self.skill_embeddings[skill1] = self.get_bert_embedding(skill1).tolist()
            if skill2 not in self.skill_embeddings:
                self.skill_embeddings[skill2] = self.get_bert_embedding(skill2).tolist()
            
            emb1 = np.array(self.skill_embeddings[skill1])
            emb2 = np.array(self.skill_embeddings[skill2])
            return float(cosine_similarity(emb1.reshape(1, -1), emb2.reshape(1, -1))[0][0])
        except Exception as e:
            print(f"Error computing skill similarity: {str(e)}")
            return 0.0

    def extract_skills_ner(self, text):
        """Extract skills using NER"""
        if self.nlp is None:
            return []
        
        try:
            doc = self.nlp(text)
            skills = []
            for ent in doc.ents:
                if ent.label_ == "SKILL":
                    skills.append(ent.text.lower())
            return skills
        except Exception as e:
            print(f"Error extracting skills with NER: {str(e)}")
            return []

    def calculate_match_score(self, resume_skills, job_skills):
        """Calculate semantic match score between resume and job skills"""
        try:
            if not resume_skills or not job_skills:
                return 0.0
            
            total_score = 0
            for job_skill in job_skills:
                skill_scores = [
                    self.compute_skill_similarity(job_skill.lower(), resume_skill.lower())
                    for resume_skill in resume_skills
                ]
                total_score += max(skill_scores) if skill_scores else 0
                
            return (total_score / len(job_skills)) * 100
        except Exception as e:
            print(f"Error calculating match score: {str(e)}")
            return 0.0

    def save_skill_embeddings(self):
        """Save computed skill embeddings"""
        try:
            with open('./data/skill_embeddings.json', 'w') as f:
                json.dump(self.skill_embeddings, f)
        except Exception as e:
            print(f"Error saving skill embeddings: {str(e)}")