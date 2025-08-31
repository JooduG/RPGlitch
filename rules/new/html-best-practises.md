# HTML Guide: Best Practices & Foundations

This guide outlines the foundational, non-negotiable principles for writing all HTML in this project. These rules ensure that our applications are structured, accessible, and valid.

**Core Principle:** Write HTML for humans and machines first, and for styling second. Structure and meaning are paramount.

---

## 1. Valid Document Structure

Every HTML file must be a valid document. This is the absolute baseline.

- **`<!DOCTYPE html>`:** The file must always start with this declaration.
- **Root Element:** The `<html>` element must have a `lang` attribute (e.g., `<html lang="en">`).
- **Head:** The `<head>` must contain a `<meta charset="UTF-8">` and a `<meta name="viewport" content="width=device-width, initial-scale=1.0">` for responsiveness, along with a descriptive `<title>`.

---

## 2. Semantic Elements for Meaning

Use HTML5 semantic elements to describe the structure of your content. Do not just use `<div>` for everything. Using the correct tag gives meaning to the content for browsers, screen readers, and other developers.

- **`<main>`:** Use for the primary, unique content of the page. There should only be one.
- **`<nav>`:** Use for major navigation blocks.
- **`<header>` & `<footer>`:** Use for the top and bottom sections of a page or an article.
- **`<article>`:** Use for self-contained pieces of content (e.g., a single entity card).
- **`<section>`:** Use to group related content together.
- **`<aside>`:** Use for supplementary content, like a sidebar.

---

## 3. Accessibility is Non-Negotiable

Web accessibility (a11y) is a requirement, not a feature.

- **Images:** All `<img>` tags **must** have an `alt` attribute. If the image is purely decorative, use an empty alt attribute (`alt=""`). If it conveys information, the alt text should describe the image.
- **Buttons & Links:** Use `<button>` for actions (like submitting a form) and `<a>` for navigation (going to another page or section). Don't mix them up.
- **Forms:** All `<input>` elements should be associated with a `<label>` element. This is crucial for screen reader users.
