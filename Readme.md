# Resume Screening Application

A modern resume screening application that helps recruiters analyze and compare candidates efficiently.

## Project Overview

A React-based application that streamlines the resume screening process by providing:
- PDF document uploads for job descriptions and resumes
- Automated skill matching and scoring
- Visual analytics and demographics
- Candidate ranking system
- Shortlisting and report generation

## Features

### Document Upload
- Drag-and-drop interface for both job descriptions and resumes
- Multi-file upload support for resumes
- Progress tracking for file uploads
- PDF format validation
- Visual feedback during upload process

### Analysis & Matching
- Automated skill extraction and matching
- Match score calculation based on required skills
- Experience and education level detection
- Location-based grouping

### Results & Analytics
1. **Demographics Dashboard**
   - Experience distribution chart
   - Education level breakdown
   - Geographic distribution
   - Key statistics:
     - Total candidates
     - Average experience
     - Average match score
     - Most common location

2. **Candidate Rankings**
   - Sorted by match score
   - Medal system for top 3 candidates
   - Detailed candidate cards showing:
     - Match percentage
     - Found skills
     - Missing required skills
     - Experience details
     - Education information
     - Location

3. **Shortlisting Features**
   - Candidate selection system
   - PDF report generation for shortlisted candidates
   - Downloadable summary of selected candidates

## Tech Stack

### Frontend
- React.js
- Tailwind CSS for styling
- Chart.js for data visualization
- PDF-lib for report generation

### UI Components
- Drag and drop file upload
- Progress bars
- Interactive charts
- Responsive design
- Modal dialogs

### Data Visualization
- Bar charts for experience distribution
- Pie charts for education and location
- Statistical summaries
- Interactive data points

## Project Structure

1. **Resume Upload**
   - Single PDF file upload
   - Text extraction
   - Store in CSV

2. **Basic Analysis**
   - Extract skills using keyword matching
   - Calculate years of experience (if mentioned)
   - Basic education level detection

3. **Simple Matching**
   - Compare against predefined skill requirements
   - Generate basic matching score
   - Show results in simple table

## Data Storage

Simple CSV structure:

1. **resumes.csv**
   - resume_id
   - extracted_text
   - skills_found
   - match_score

## API Endpoints
- POST /api/upload - Upload resume
- GET /api/results/{resume_id} - Get analysis results
