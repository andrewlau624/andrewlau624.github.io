/* ==========================================================================
   content.js  |  the whole site
   --------------------------------------------------------------------------
   Everything renders from this object. One column in the dark: a name, a
   line, three tabs, links, and a car you can drive.

   tabs
     Work        education, industry, then projects
     Leadership  leadership, volunteering, then awards
     Personal    hobbies, and a song

   Blog posts do not live here. They are markdown files in posts/, written
   with `npm run new` and listed in the generated posts.js.
   ========================================================================== */

window.PORTFOLIO = {
  meta: {
    name: "Andrew Lau",
    role: "Computer Science",
    school: "UC Berkeley",
    location: "San Francisco, CA",
    email: "andrew.lau@berkeley.edu"
  },

  intro: {
    bio: "I build fast systems for search and language models. Currently a software engineer at Pacific, before that Apple and the Berkeley EECS department."
  },

  tabs: [
    {
      id: "work",
      label: "Work",
      groups: [
        {
          label: "Industry",
          items: [
            { name: "Pacific", note: "Software Engineer", year: "2026 - Present" },
            { name: "Apple", note: "Machine Learning Engineer, contract", year: "2026" },
            { name: "UC Berkeley EECS", note: "Research Software Engineer Lead", year: "2025 - 2026" },
            { name: "Stanford iGEM", note: "Software Intern, then Teaching Assistant", year: "2025" },
            { name: "Influcio", note: "Software Engineer", year: "2025" },
            { name: "Heart in Motion", note: "Technical Lead, full stack", year: "2022 - 2025" }
          ]
        },
        {
          label: "Projects",
          items: [
            {
              name: "Chowtown",
              note: "Chinatown Hacks winner",
              year: "2026",
              href: "https://github.com/andrewlau624/chinatown-hacks-restaurant-project"
            },
            { name: "NerfGuard", note: "Local AI gateway", year: "2026" },
            { name: "Picobot", note: "Email agent system", year: "2026" },
            {
              name: "Orpheus Live",
              note: "On device voice agent",
              year: "2025",
              href: "https://github.com/andrewlau624/orpheus-live"
            }
          ]
        },
        {
          label: "Education",
          items: [
            { name: "UC Berkeley", note: "Computer Science, B.S.", year: "2025 - 2028" }
          ]
        }
      ]
    },
    {
      id: "leadership",
      label: "Leadership",
      groups: [
        {
          label: "Leadership",
          items: [
            { name: "Generative AI @ Berkeley", note: "President", year: "2026 - Present" }
          ]
        },
        {
          label: "Volunteering",
          items: [
            { name: "Computer Science Mentors", note: "Junior Mentor", year: "2026 - Present" }
          ]
        },
        {
          label: "Awards",
          items: [
            { name: "Best Use of Twelve Labs", note: "Chinatown Hacks", year: "2026" },
            { name: "Valedictorian", note: "High school", year: "2024" }
          ]
        }
      ]
    },
    {
      id: "off",
      label: "Personal",
      player: true,
      groups: [
        {
          label: "Personal",
          items: [
            { name: "Soccer", note: "Pickup games, weekends" },
            { name: "Cars", note: "Track days and wrenching" },
            { name: "Swimming", note: "Laps, most mornings" }
          ]
        }
      ]
    }
  ],

  /* the Spotify embed in the Personal tab */
  song: {
    url: "https://open.spotify.com/track/2kwdPfqvLQICtdVN9gCRZS?si=2be43e3a44fb41ec"
  },

  links: [
    { label: "GitHub", href: "https://github.com/andrewlau624" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/andrewlau624/" },
    { label: "Resume", href: "resume.pdf" },
    { label: "Email", href: "mailto:andrew.lau@berkeley.edu" }
  ],

  blog: {
    label: "Blog",
    href: "blog.html",
    note: "Just my thoughts."
  },

  /* the turntable cycles these. add a car by adding an entry.
     accel is metres per second squared, top is km/h. both are the real
     figures for the car, so the driving feels like the car it is. */
  car: {
    note: "Up to drive, left and right to steer",
    models: [
      {
        name: "Apollo IE",
        src: "assets/apollo.glb",
        color: "#a03328",
        accel: 9.9,
        top: 335
      },
      {
        name: "Corvette ZR1",
        src: "assets/corvette.glb",
        color: "#d8a41f",
        accel: 11.7,
        top: 375
      },
      {
        name: "Ferrari SF90",
        src: "assets/ferrari.glb",
        color: "#c8102e",
        accel: 10.7,
        top: 340
      }
    ]
  }
};
