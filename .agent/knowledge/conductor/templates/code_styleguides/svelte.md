# Svelte 5 Style Guide

## Core Principles

- **Runes**: Use `$state`, `$derived`, `$effect`, `$props` exclusively.
- **No Legacy**: Avoid `writable/readable` stores, `export let`, or `createEventDispatcher`.
- **Extension**: Use `.svelte` for components, `.svelte.js` for reactive modules.

## Component Structure

1. `<script>` (Logic)
2. `<template>` (Markup)
3. `<style>` (Styles - if not using utility classes)

## Reactivity

- **State**: `let count = $state(0);`
- **Derived**: `let double = $derived(count * 2);`
- **Props**: `let { title, children } = $props();`
- **Side Effects**: `$effect(() => { ... });`

## Global State

- Use `.svelte.js` modules for shared state.
- Export classes or raw objects wrapped in `$state`.

## Styling

- Use scoped CSS in `<style>` blocks or functional CSS classes.
- Do not use `@apply` if avoiding Tailwind compilation.
