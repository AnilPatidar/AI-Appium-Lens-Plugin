# AI Appium Lens Plugin

## Overview

The AI Appium Lens Plugin is designed to enhance the capabilities of Appium by integrating AI-based image recognition and interaction features. This plugin leverages Google Cloud's Vision and Vertex AI services to provide advanced functionalities such as identifying elements on the screen and performing actions based on AI analysis.

## Why is this Plugin Needed?

Automated testing often requires interacting with elements on the screen that may not have easily identifiable locators. Traditional methods rely heavily on static locators, which can be brittle and fail when the UI changes. The AI Appium Lens Plugin addresses this issue by using AI to dynamically identify and interact with elements based on their visual characteristics, making your tests more robust and adaptable to UI changes.

Key Highlights of the Plugin

Answer natural language queries about the app's UI, describes App UI, colour of button, what type of icon on the app, what are the input fields , what type screen is displayed?
Provide detailed accessibility insights for visually impaired users.
Generate actionable outputs like clickable element coordinates and hierarchical structures.

## Features

- **AI-based Element Identification**: Use Google Cloud Vision to identify elements on the screen based on their visual characteristics.
- **Dynamic Interaction**: Perform actions on elements identified by AI, reducing dependency on static locators.
- **Session Management**: Persist session data and image URLs to maintain context across multiple interactions.
- **Screenshot Handling**: Automatically take and manage screenshots for AI analysis.

## Prerequisite

You must have a google cloud account with payment configured and a project created.

Download google cloud sdk ( google-cloud-cli-darwin-arm.tar.gz) : https://cloud.google.com/sdk/docs/install

Unzip and go to the path

```sh
export PATH=$PATH:/Users/anil-patidar/Downloads/google-cloud-sdk/bin
source ~/.zshrc
gcloud init
gcloud auth application-default login

```

## Installation

To install the AI Appium Lens Plugin, follow these steps:

appium plugin install --source=npm ai-appium-lens

Set enviornment variables :

```sh
export GOOGLE_PROJECT_ID=your-project-id
export GOOGLE_LOCATION=your-location
export GOOGLE_MODEL=your-model
```

## Usage

## AI Click

The aiClick method allows you to perform a click action on an element identified by AI.

driver.addCommand(HttpMethod.POST,
"/session/:sessionId/plugin/ai-appium-lens/aiClick",
"aiClick");

```sh
        clickByAI( driver.execute("aiClick",
                ImmutableMap.of("text","kabaddi",
                        "firstCallOnThisScreen",true,
                        "isScreenRefreshed",false)), "click kabaddi tab ");
```

## Ask AI

The askAI method allows you to send an instruction to the AI and get a response based on the current screen.

```sh
        const response = await driver.execute('askAI', {
         instruction: 'What do you see on UI?'
         });
```

Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

License
This project is licensed under the MIT License.
