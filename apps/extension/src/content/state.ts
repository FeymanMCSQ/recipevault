/**
 * RecipeVault Content Script - Shared State
 */

import type { SelectionData } from "./types";

// DOM references
export let shadowHost: HTMLElement | null = null;
export let shadowRoot: ShadowRoot | null = null;
export let saveButton: HTMLButtonElement | null = null;
export let modal: HTMLElement | null = null;
export let toastContainer: HTMLElement | null = null;

// State
export let currentSelectionData: SelectionData | null = null;
export let isModalOpen = false;
export let lastMousePosition = { x: 0, y: 0 };

// Setters
export function setShadowHost(el: HTMLElement): void { shadowHost = el; }
export function setShadowRoot(root: ShadowRoot): void { shadowRoot = root; }
export function setSaveButton(btn: HTMLButtonElement): void { saveButton = btn; }
export function setModal(el: HTMLElement): void { modal = el; }
export function setToastContainer(el: HTMLElement): void { toastContainer = el; }
export function setCurrentSelectionData(data: SelectionData | null): void { currentSelectionData = data; }
export function setIsModalOpen(open: boolean): void { isModalOpen = open; }
export function setLastMousePosition(pos: { x: number; y: number }): void { lastMousePosition = pos; }
