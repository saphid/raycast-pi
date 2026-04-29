/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Pi Binary Path - Path to the pi executable. Leave empty to auto-detect from PATH and common install locations. */
  "piBinaryPath"?: string,
  /** Pi Agent Directory - Directory containing Pi sessions, prompts, and skills. Defaults to ~/.pi/agent. */
  "agentDir"?: string,
  /** Default Project - Default working directory for Ask Pi and terminal handoffs. */
  "defaultProject"?: string,
  /** Default Model - Optional Pi model pattern, for example openai/gpt-4o or anthropic/claude-sonnet-4. */
  "defaultModel"?: string,
  /** Thinking Level - Optional thinking level passed to Pi. */
  "thinkingLevel": "" | "off" | "minimal" | "low" | "medium" | "high" | "xhigh",
  /** Terminal Application - Terminal used for visible Pi handoff. */
  "terminalApp": "default" | "terminal" | "iterm" | "ghostty" | "warp" | "kitty" | "alacritty"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `ask-pi` command */
  export type AskPi = ExtensionPreferences & {}
  /** Preferences accessible in the `ask-pi-copy` command */
  export type AskPiCopy = ExtensionPreferences & {}
  /** Preferences accessible in the `projects` command */
  export type Projects = ExtensionPreferences & {}
  /** Preferences accessible in the `sessions` command */
  export type Sessions = ExtensionPreferences & {}
  /** Preferences accessible in the `transform-selection` command */
  export type TransformSelection = ExtensionPreferences & {}
  /** Preferences accessible in the `git-actions` command */
  export type GitActions = ExtensionPreferences & {}
  /** Preferences accessible in the `resources` command */
  export type Resources = ExtensionPreferences & {}
  /** Preferences accessible in the `status` command */
  export type Status = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `ask-pi` command */
  export type AskPi = {
  /** What do you want to ask Pi? */
  "question": string
}
  /** Arguments passed to the `ask-pi-copy` command */
  export type AskPiCopy = {
  /** What do you want to ask Pi? */
  "question": string
}
  /** Arguments passed to the `projects` command */
  export type Projects = {}
  /** Arguments passed to the `sessions` command */
  export type Sessions = {}
  /** Arguments passed to the `transform-selection` command */
  export type TransformSelection = {}
  /** Arguments passed to the `git-actions` command */
  export type GitActions = {}
  /** Arguments passed to the `resources` command */
  export type Resources = {}
  /** Arguments passed to the `status` command */
  export type Status = {}
}

