# TODO:

## BUGS:

- so far so good?

## New features:

- Sidebar improvements, more information about the thread quickly
- Text input, we should be able to press a button and record a prompt.
- Text to voice, we should have a button to have the models replies be read with text to voice.

# new thread setting: User Prompt

- Add a new thread setting called user prompt, a string, this setting should be persisted in the threads table and default to null
- Update the system prompt generation to include the user prompt if it is not null

Extract the system prompt generation from the route file into it's own file in lib/ollama/system-prompt
