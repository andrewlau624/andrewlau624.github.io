/* ==========================================================================
   content.js  |  the whole site
   --------------------------------------------------------------------------
   Written by npm run edit. Everything on the page renders from this object.
   ========================================================================== */

window.PORTFOLIO = {
  "meta": {
    "name": "Andrew Lau",
    "role": "Computer Science",
    "school": "UC Berkeley",
    "location": "San Francisco, CA",
    "email": "andrew.lau@berkeley.edu"
  },
  "intro": {
    "bio": "I build token efficiency tools and optimize agentic workflows. Currently a software engineer at Pacific, and President of Generative AI @ Berkeley - the first and largest student-run generative AI organization in California."
  },
  "tabs": [
    {
      "id": "work",
      "label": "Work",
      "groups": [
        {
          "label": "Industry",
          "items": [
            {
              "name": "Pacific",
              "note": "Software Engineer Intern",
              "year": "2026 - Present",
              "href": ""
            },
            {
              "name": "Apple",
              "note": "Machine Learning Engineer (Contract)",
              "year": "2026",
              "href": ""
            },
            {
              "name": "UC Berkeley EECS",
              "note": "Research Software Engineer Lead",
              "year": "2025 - 2026"
            },
            {
              "name": "Stanford iGEM",
              "note": "Software Intern, then Teaching Assistant",
              "year": "2025"
            },
            {
              "name": "Influcio",
              "note": "Software Engineer Intern",
              "year": "2025",
              "href": ""
            },
            {
              "name": "Heart in Motion",
              "note": "Technical Lead, Full-stack Engineer",
              "year": "2022 - 2025",
              "href": ""
            }
          ]
        },
        {
          "label": "Projects",
          "items": [
            {
              "name": "NerfGuard",
              "note": "Local AI gateway for token optimization.",
              "year": "2026",
              "href": "https://nerfguard.com/"
            },
            {
              "name": "Orpheus Live",
              "note": "Simulating conversational cognition through Orpheus TTS.",
              "year": "2025",
              "href": "https://github.com/andrewlau624/orpheus-live"
            },
            {
              "name": "Chowtown",
              "note": "Chinatown Hacks winner.",
              "year": "2025",
              "href": "https://github.com/andrewlau624/chinatown-hacks-restaurant-project"
            }
          ]
        },
        {
          "label": "Education",
          "items": [
            {
              "name": "UC Berkeley",
              "note": "Computer Science, B.A.",
              "year": "2025 - 2028",
              "href": ""
            }
          ]
        }
      ]
    },
    {
      "id": "leadership",
      "label": "Leadership",
      "groups": [
        {
          "label": "Extracurriculars",
          "items": [
            {
              "name": "Generative AI @ Berkeley",
              "note": "President",
              "year": "2026 - Present",
              "href": "https://berkeleygenai.org/"
            },
            {
              "name": "Computer Science Mentors",
              "note": "Junior Mentor",
              "year": "2026",
              "href": ""
            },
            {
              "name": "Berkeley Asian American Association",
              "note": "Social Memeber",
              "year": "2026",
              "href": ""
            }
          ]
        },
        {
          "label": "Awards",
          "items": [
            {
              "name": "Best Use of Twelve Labs",
              "note": "Chinatown Hacks",
              "year": "2026"
            },
            {
              "name": "Valedictorian",
              "note": "High school",
              "year": "2024"
            }
          ]
        }
      ]
    },
    {
      "id": "off",
      "label": "Personal",
      "player": true,
      "groups": [
        {
          "label": "Personal",
          "items": [
            {
              "name": "Hobbies",
              "note": "Cars, Cooking, Soccer, Swimming",
              "year": "",
              "href": ""
            },
            {
              "name": "Favorite Movie",
              "note": "18×2 Beyond Youthful Days",
              "year": "2024",
              "href": "https://www.imdb.com/title/tt31039829/"
            }
          ]
        }
      ]
    }
  ],
  "song": {
    "url": "https://open.spotify.com/track/2kwdPfqvLQICtdVN9gCRZS?si=2be43e3a44fb41ec"
  },
  "links": [
    {
      "label": "GitHub",
      "href": "https://github.com/andrewlau624"
    },
    {
      "label": "LinkedIn",
      "href": "https://www.linkedin.com/in/andrewlau624/"
    },
    {
      "label": "Resume",
      "href": "resume.pdf"
    },
    {
      "label": "Email",
      "href": "mailto:andrew.lau@berkeley.edu"
    }
  ],
  "blog": {
    "label": "Blog",
    "href": "blog.html",
    "note": "Just my thoughts."
  },
  "car": {
    "note": "Up to drive, left and right to steer",
    "models": [
      {
        "name": "Apollo IE",
        "src": "assets/apollo.glb",
        "color": "#a03328",
        "accel": 9.9,
        "top": 335
      },
      {
        "name": "Corvette ZR1",
        "src": "assets/corvette.glb",
        "color": "#d8a41f",
        "accel": 11.7,
        "top": 375
      },
      {
        "name": "Ferrari SF90",
        "src": "assets/ferrari.glb",
        "color": "#c8102e",
        "accel": 10.7,
        "top": 340
      }
    ]
  }
};
