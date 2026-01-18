# Badge
Building a unique professional identity for meaningful connections and effective networking at hackathons, conferences, and career fairs!'

See our Devpost: https://devpost.com/software/badge

See a video demo: https://youtu.be/LNbBaZ9Qs3c

## Inspiration
We were inspired by a problem many of us encountered this very weekend, as well as at past hackathons: networking. We noticed that many of us struggled to find sponsors; went into discussions blind; and that many students asked the same, generic questions at every booth. I’m sure many of our sponsors noticed the same issue – so how do we fix it?

We realized that **professional** identity – our special interests, past experiences, and unique perspectives – is often poorly understood by us, as students, and weakly conveyed when talking to potential connections. To address this, we wanted to build a tool that could:

- Facilitate connections and make it easier to build relationships on the basis of shared career interests and goals
- Make it easier to have **genuine conversations** with sponsors by connecting students with sponsors that relate to their interest, and **highlighting** aspects of each company that best relate to that students' professional identity
- Make networking at Hackathons, academic/industry conferences, and career fairs simpler and more efficient for not only students, but working professionals, academics, and the sponsors themselves!

So we set out to build our users a tool to do just that – their own personal **Badge**.

## What it does
A user’s Badge is their best friend when it comes to making lasting, meaningful connections and building their unique professional identity. Users will have the opportunity to customize their Badge, tailoring it to their specific interests and unique personal experiences. 

With options to link their GitHub, LinkedIn, and Slack accounts, users will also be able to generate an AI-Extracted Identity in their Profile upon uploading their resumes. The user’s Profile will be used to generate suggested talking points for each company at the specific conference, career fair, or Hackathon the user is attending. In the process, we help users personalize their approach to networking and, in the process, companies hear a wider variety of unique questions throughout the event!

The Knowledge Graph highlights all key people and companies who are present at the event. Through this interface, the user can see company descriptions and access their suggested talking points. Most importantly, it will help users visualize relationships and networking opportunities in a fun, clean, and intuitive way! In addition to the Knowledge Graph, the Identity Graph allows users to visually compare the <u>similarities</u> (and **dis**similarities) in their respective, unique profiles.

Last, but certainly not least, there will be an option for Live recordings of conversations with sponsor companies. This data will be used to generate a summary of key details that may come in handy in a future conversation – or even interview! – with that company. You can then chat with a bot to practice your networking skills. The bot will be based on the recorded conversation, and use Backboard.io to learn from past chat history to adapt to the users' preferences and behaviour.

## How we built it
We used a combination of React, Javascript, and Typescript to build our user interface and backend logic. Our database was deployed through Convex, allowing for real-time file storage and database management, and combined with Clerk for user authentication and ID tracking. 

The AI-Extracted Identity feature uses the Gemini API to glean insights from a user’s resume and profile information. We then use the Identity information extracted through Gemini, along with the company descriptions (hard-coded for the MVP), to generate our personalized suggested talking points for each company or recruiter in the Knowledge Graph (also through Gemini). 

For the Identity Graph, we used a Snowflake warehouse to vectorize user profile information and then map these high-dimensional vectors to a 3D plane using principal component analysis (PCA). 

For the Live recording tab, we took advantage of ElevenLabs for speech-to-text generation, allowing us to transcribe live conversations with high fidelity. The text was then fed through Gemini to extract key insights and summarize the most important details. As previously mentioned, Backboard.io and Gemini Flash 2.5 (through the Gemini API) were used to make the Networking Practice Chatbot, which is based on the summaries of the recorded conversation, previous chat history, and user identity information. 

## Challenges we ran into
Some of the major challenges we ran into include:

- Querying data from multiple sources (Convex, Company Descriptions, etc.) and then feeding this data into our Personalization Engine to generate Suggested Talking Points. We struggled with getting the Personalization Engine to properly fetch the data from the Convex development server and then turn that data into something usable for our ‘Talking Points’ generation prompt function.

- The interaction between our Snowflake warehouse and Convex database was a particular challenge. There were lots of moving parts when trying to figure out the most optimal workflow for sending user information from the Convex db to the Snowflake warehouse for vectorization, and then integrating the vectorization from Snowflake into the frontend. 

- Enabling speech-to-text through ElevenLabs. In particular, we wanted to make sure speech-to-text was highly accurate while avoiding the issue of our sensitivity level being too high (or too low). 

## Accomplishments that we're proud of
- Delivering a working MVP ahead of schedule

- Succesfully settling a few pretty intimidating merge conflicts and recurrent error messages

- Open and frequent team communication to solve merge conflicts, manage our tasks, and 
make sure we’re aware of what team members own and are up to

## What we learned
- We learned about implementing speech-to-text with ElevenLabs, and implementing multiple data sources (ElevenLabs-generated text, Convex database, Snowflake warehouses) into our models

- We learned how to smartly leverage multiple models for both insights and generation of content; and (importantly!) about API token management and managing multiple different API keys across users

- Effectively using Copilot as a force multiplier and AI pair-programmer to enhance our productivity and augment our code

- To always make time at hackathons for having fun!

## What's next for Badge
Enabling a Company User mode with a different interface – allowing companies and other entities at career fairs, conferences, and Hackathons to see talent profiles, filter by unique identifiers, and publish their own company descriptions. 
