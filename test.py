import requests
import json
import os

url = 'http://localhost:8000/api/upload'

# Correct way to handle multiple files with the same field name
files = [
    ('job_description', open(os.path.join('job description', 'data_scientist_job.txt'), 'rb')),
    ('resumes', open(os.path.join('resume pdf', 'data_scientist_resume.txt'), 'rb')),
    ('resumes', open(os.path.join('resume pdf', 'software_engineer_resume.txt'), 'rb')),
    ('resumes', open(os.path.join('resume pdf', 'cyber_security_analyst.pdf'), 'rb'))
]

try:
    response = requests.post(url, files=files)
    print(json.dumps(response.json(), indent=4))
finally:
    # Close all file handles
    for _, file in files:
        file.close()