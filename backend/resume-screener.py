from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import PyPDF2
import spacy
import io
import re
from datetime import datetime
import json
from spacy.matcher import PhraseMatcher
from resume_ml import ResumeML
import torch

app = FastAPI(title="Resume Screener API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model and initialize ML
nlp = spacy.load("en_core_web_sm")
resume_ml = ResumeML()

# Add these helper functions after the imports and before the class definitions

def extract_text_from_pdf(pdf_file) -> str:
    """Extract text content from uploaded PDF file"""
    try:
        pdf_file_obj = io.BytesIO(pdf_file)
        pdf_reader = PyPDF2.PdfReader(pdf_file_obj)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PDF file: {str(e)}")

def extract_email(text: str) -> str:
    """Extract email address from text"""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    matches = re.findall(email_pattern, text)
    return matches[0] if matches else ""

def extract_phone(text: str) -> str:
    """Extract phone number from text"""
    phone_patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
        r'\d{10}',
        r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
    ]
    
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        if matches:
            return matches[0]
    return ""

def extract_name(text: str) -> str:
    """Extract name from resume text using multiple patterns"""
    # Clean the text first - handle potential PDF formatting issues
    text = ' '.join(text.split())
    
    # Pattern 1: Look for explicit name headers with various formats
    name_headers = [
        r'Name\s*[:|-]\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})',
        r'Name\s*\n\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})',
        r'^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s*\n',
        r'^\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s*$'
    ]
    
    # Pattern 2: Look for name near contact information
    contact_context = [
        r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s*(?=\n.*?(?:Email|Phone|Address):)',
        r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s*\n.*?@'
    ]
    
    # Pattern 3: Common name formats with Asian surnames
    asian_names = r'([A-Z][a-zA-Z]+\s+(?:Chen|Wang|Li|Zhang|Liu|Kim|Park|Lee|Han|Cho|Wu|Yang|Huang|Yu)\b)'
    
    # Pattern 4: Email-based name extraction
    email_patterns = [
        r'([a-zA-Z]+)\.([a-zA-Z]+)@',
        r'([a-zA-Z]+)_([a-zA-Z]+)@',
        r'([a-zA-Z]{2,})([a-zA-Z]{2,})@'
    ]
    
    # Try each pattern in order of reliability
    all_patterns = name_headers + contact_context + [asian_names]
    
    for pattern in all_patterns:
        matches = re.search(pattern, text, re.MULTILINE | re.IGNORECASE)
        if matches:
            name = matches.group(1).strip()
            # Ensure proper capitalization
            name = ' '.join(word.capitalize() for word in name.split())
            # Remove any extra whitespace or special characters
            name = re.sub(r'[^\w\s]', '', name)
            # Take only first two words
            name_parts = name.split()[:2]
            if len(name_parts) == 2:  # Only return if we have exactly two parts
                return ' '.join(name_parts).strip()
    
    # Try email patterns as last resort
    for email_pattern in email_patterns:
        email_matches = re.search(email_pattern, text.lower())
        if email_matches:
            # Don't extract name from generic email patterns
            if email_matches.group(1) in ['first', 'user', 'mail', 'email', 'contact']:
                continue
            first = email_matches.group(1).capitalize()
            last = email_matches.group(2).capitalize()
            return f"{first} {last}"
            
    return "Unknown"

def extract_skills(text: str) -> List[str]:
    """Extract skills using pattern matching"""
    skill_patterns = [
        'python', 'java', 'javascript', 'react', 'node.js', 'sql',
        'machine learning', 'data science', 'artificial intelligence',
        'deep learning', 'nlp', 'computer vision', 'data analysis',
        'aws', 'azure', 'docker', 'kubernetes', 'git'
        # Add more skills as needed
    ]
    
    found_skills = set()
    text_lower = text.lower()
    
    for skill in skill_patterns:
        if skill.lower() in text_lower:
            found_skills.add(skill)
    
    return list(found_skills)

def extract_experience(text: str) -> float:
    """Extract years of experience from text"""
    experience_patterns = [
        r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
        r'experience\s*(?:of\s+)?(\d+)\+?\s*years?',
        r'years\s+of\s+experience\s*:\s*(\d+)',
        r'total\s+experience\s*:\s*(\d+)'
    ]
    
    for pattern in experience_patterns:
        matches = re.findall(pattern, text.lower())
        if matches:
            return float(matches[0])
    return 0.0

def detect_education_level(text: str) -> str:
    """Detect highest education level"""
    education_levels = {
        'phd': ['phd', 'doctorate', 'ph.d'],
        'masters': ['masters', 'mba', 'ms', 'msc'],
        'bachelors': ['bachelors', 'btech', 'be', 'bs'],
        'high school': ['high school', 'secondary']
    }
    
    text_lower = text.lower()
    for level, keywords in education_levels.items():
        if any(keyword in text_lower for keyword in keywords):
            return level.title()
    return "Not Specified"

class MatchResult(BaseModel):
    id: str
    name: str
    email: str
    matchScore: float
    skillsFound: List[str]
    experience: float
    education: str

class ScreeningResult(BaseModel):
    requiredSkills: List[str]
    candidates: List[MatchResult]

@app.post("/api/upload")
async def process_documents(
    job_description: UploadFile = File(...),
    resumes: List[UploadFile] = File(default=...)
) -> ScreeningResult:
    """
    Process job description and multiple resumes, return match results
    """
    if not resumes:
        raise HTTPException(status_code=400, detail="No resumes provided")
        
    try:
        # Process job description
        job_content = await job_description.read()
        if job_description.filename.lower().endswith('.pdf'):
            job_text = extract_text_from_pdf(job_content)
        else:
            job_text = job_content.decode('utf-8')
        
        # Extract job requirements
        job_skills = extract_skills(job_text)
        job_experience = extract_experience(job_text)
        job_education = detect_education_level(job_text)
        
        # Process each resume and calculate matches
        candidates = []
        for idx, resume in enumerate(resumes):
            try:
                # Read resume content
                resume_content = await resume.read()
                if resume.filename.lower().endswith('.pdf'):
                    resume_text = extract_text_from_pdf(resume_content)
                else:
                    resume_text = resume_content.decode('utf-8')
                
                # Extract contact information
                email = extract_email(resume_text)
                phone = extract_phone(resume_text)
                
                # Extract resume information
                resume_skills = extract_skills(resume_text)
                resume_experience = extract_experience(resume_text)
                resume_education = detect_education_level(resume_text)
                
                # Calculate skill match score using ML
                skill_match_score = resume_ml.calculate_match_score(resume_skills, job_skills)
                
                # Create a unique ID for each candidate
                candidate_id = f"candidate_{idx + 1}"
                
                # Extract name from resume text or filename
                name = extract_name(resume_text) or resume.filename.split('.')[0]
                
                candidates.append(MatchResult(
                    id=candidate_id,
                    name=name,
                    email=email,
                    matchScore=skill_match_score,
                    skillsFound=resume_skills,
                    experience=resume_experience,
                    education=resume_education
                ))
            
            except Exception as e:
                print(f"Error processing resume {resume.filename}: {str(e)}")
                continue
        
        # Sort candidates by matchScore
        candidates.sort(key=lambda x: x.matchScore, reverse=True)
        
        # Return the response in the exact structure frontend expects
        return ScreeningResult(
            requiredSkills=job_skills,
            candidates=candidates
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
