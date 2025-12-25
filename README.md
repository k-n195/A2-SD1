# A2-SD1 Hangman Project KN

We have selected the classic Hangman word-guessing game as our project and will implement it using HTML, CSS, and JavaScript. This stack allows us to deliver an accessible browser-based experience without requiring additional installations.

## Technology Stack Rationale

- Universally available platform: A standards-compliant browser is the only requirement, so the game is instantly accessible on mobiles. 
- Rapid iteration: HTML and CSS speed up layout and visual experimentation, while JavaScript lets us implement the game loop, scoring rules, and input validation directly in the browser.
- Easy deployment: The finished build can be hosted on any static web server or even bundled as part of coursework submissions without special packaging. KN

## Activity 1 Group Guidance – Requirements/Creative Session KN

1. Review all available projects before deciding which to develop

The group reviewed the three available mini-project options: Hangman, Hide and Seek, and a Chat App. After discussion, Hangman was selected as it has clearly defined rules, a manageable scope, and is well suited to iterative development using Agile methods. It allows the group to focus on core functionality without unnecessary complexity while still demonstrating good software design principles.

2. Consider your primary target audience (see Possible Project Target Demographics).

The primary target audience for the Hangman game is:

Students and casual users aged 12–25

Users looking for a simple, short-play, word-based game

Players accessing the game on desktop or mobile browsers
The game is designed to be easy to understand, quick to play, and accessible to users with different technical abilities.

4. Create an overall specification based on user and system requirements (including HCI, game rules and the game mechanics—for example, what are the rules for the game, how will the game be controlled, and how will any non-player characters interact?).

Simple game with hints after failed attempts and letters already used in a grid to show that they are incorrect, could possibly be outlined in red to show failure and anything correct potentially outlined in green. Not too much information in large font and bold. Large font and boldness is proven to distract the target audience as at the end of the day they are looking for a fun and simple game to play without having to think too hard as we have opted for a younger target audience.

5. Risks during testing and development.

6. Create two different user profiles (based on your selected target type) that include basic details regarding each individual’s wants and needs associated with the game.

   User Profiles:

Profile 1 Michael: Age 17, short attention span wants fast paced gaming and results with minimal effort.

Profile 2 Harry Age 22, Likes playing with friends and has a longer attention span, competitive and wants to win when playing against friends.
   
8. Determine the project’s high-level functional specifications (for example, hardware requirements, operating system environment, application functions, collisions, AI, scores, timers, etc.).
9. Determine the project’s high-level non-functional specifications (aesthetic, usability, ease of use, feedback style, basic needs, etc.).

Hardware requirements (basic)

For Basic/Classic Hangman (Web/Simple Apps):
OS: Windows XP/7/10, Linux, iOS, Android.
CPU: Any 2 GHz processor.
RAM: 512 MB - 1 GB.
Storage: < 1 GB.
Graphics: Integrated graphics. 

Aesthetic:

Going for a simple and sleek design that appeases the target audience being casual players aged 12-25, Little information that entices the user to play the game making it colorful and aethetically pleasing.
   
11. Create mock-ups for the overall look, user interface design, dialogue windows and input mechanisms.

<img width="1084" height="1140" alt="image" src="https://github.com/user-attachments/assets/318eeda6-939a-47b2-82b6-2949a2b2325d" />

<img width="478" height="759" alt="image" src="https://github.com/user-attachments/assets/2916741e-df62-406b-bc26-7a16dffde9da" />


12. Construct basic storyboards associated with the game play.
<img width="1024" height="1536" alt="ChatGPT Image Dec 25, 2025, 12_34_17 PM" src="https://github.com/user-attachments/assets/d2d4e0fa-6131-46e3-b078-4e093b1b6440" />

13. Identify and rank potential risks to the project’s success (such as technical knowledge, coding, testing, scope and dependencies). This should not include time management.
The following risks were identified during planning and are ranked based on their potential impact on the successful delivery of the Hangman game. Time management has not been included.

1. Coding and Game Logic Errors (High Risk)

There is a risk that errors in the JavaScript game logic could cause incorrect win or loss conditions, letters not revealing correctly, or lives not updating as expected. As Hangman relies heavily on conditional logic and state tracking, bugs in these areas could prevent the game from functioning correctly.

2. Input Handling and Validation Issues (High Risk)

Incorrect handling of user input (such as repeated guesses, non-alphabet characters, or rapid key presses) could break the gameplay experience. Poor input validation may also lead to unfair loss of lives or confusion for the player.

3. User Interface and Feedback Problems (Medium Risk)

There is a risk that the user interface may not update correctly after each guess, causing a mismatch between the game logic and what the user sees on screen. This includes incorrect colour feedback for used letters or unclear messages after guesses.

4. Accessibility and Usability Limitations (Medium Risk)

If keyboard-only interaction, visual contrast, or feedback clarity is not implemented properly, some users may struggle to play the game. This could negatively affect the overall usability and assessment outcome.

5. Scope Creep (Low–Medium Risk)

There is a risk of adding unnecessary features such as advanced scoring systems, animations, or multiplayer functionality, which could complicate the codebase and reduce overall stability.

6. Dependency on External Assets (Low Risk)

If external word lists or assets are used and become unavailable, the game may fail to load or function correctly. This risk is reduced by keeping all assets locally within the project files.
14. Identify and establish your software development strategy.

15. Define an overall test plan (this will be used later and may be repeated several times to ensure the project is successful).

Opened the game to check it loads correctly.
Expected: The word is hidden and all lives are available.
Result: Pass.

Guessed a correct letter.
Expected: The letter appears in the word.
Result: Pass.

Guessed an incorrect letter.
Expected: One life is removed.
Result: Pass.

Guessed a letter that appears more than once in the word.
Expected: All matching letters appear.
Result: Pass.

Guessed the same letter twice.
Expected: No life is lost and feedback is shown.
Result: Pass.

Made several incorrect guesses.
Expected: The hangman image updates correctly.
Result: Pass.

Completed the word by guessing all letters.
Expected: A win message is displayed.
Result: Pass.

Used all remaining lives.
Expected: A game over message is displayed with the correct word.
Result: Pass.

Clicked the restart button.
Expected: The game resets to its starting state.
Result: Pass.

Played the game using only the keyboard.
Expected: The game remains fully playable.
Result: Pass.

Used the on-screen keyboard buttons.
Expected: Letters register correctly.
Result: Pass.

Resized the screen to a mobile view.
Expected: The layout remains readable and usable.
Result: Pass.
