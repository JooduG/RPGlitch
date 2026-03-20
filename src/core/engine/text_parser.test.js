import { describe, it, expect } from "vitest"
import { parse_scene_header, clean_image_prompts } from "./text_parser.js"

describe("clean_image_prompts", () => {
    it("should remove standard <image_prompt> tags and their content", () => {
        const text = "Hello <image_prompt>a cat</image_prompt> world"
        expect(clean_image_prompts(text)).toBe("Hello  world")
    })

    it("should remove self-closing <image_prompt /> tags", () => {
        const text = "Hello <image_prompt /> world"
        expect(clean_image_prompts(text)).toBe("Hello  world")
    })

    it("should remove self-closing tags with attributes", () => {
        const text = 'Hello <image_prompt src="cat.png" alt="A cat" /> world'
        expect(clean_image_prompts(text)).toBe("Hello  world")
    })

    it("should remove multiple image prompts", () => {
        const text = "Start <image_prompt>one</image_prompt> middle <image_prompt /> end"
        expect(clean_image_prompts(text)).toBe("Start  middle  end")
    })

    it("should handle newlines inside the image prompt tag", () => {
        const text = "Line 1\n<image_prompt>\na cute\ncat\n</image_prompt>\nLine 2"
        expect(clean_image_prompts(text)).toBe("Line 1\n\nLine 2")
    })

    it("should be case-insensitive", () => {
        const text = "Hello <IMAGE_PROMPT>cat</Image_Prompt> world <Image_Prompt />"
        expect(clean_image_prompts(text)).toBe("Hello  world ")
    })

    it("should return the original text if there are no image prompts", () => {
        const text = "Just some normal text with no prompts."
        expect(clean_image_prompts(text)).toBe("Just some normal text with no prompts.")
    })

    it("should handle empty strings, null, and undefined gracefully", () => {
        expect(clean_image_prompts("")).toBe("")
        expect(clean_image_prompts(null)).toBe("")
        expect(clean_image_prompts(undefined)).toBe("")
    })

    it("should remove image prompt tags with extra whitespace", () => {
        const text = "Test <image_prompt    >content</image_prompt   > test2 <image_prompt   />"
        expect(clean_image_prompts(text)).toBe("Test  test2")
    })
})

describe("parse_scene_header", () => {
    it("should parse a standard scene header", () => {
        const text = "『 [Dark Forest] · [Midnight] · [Raining] 』\nThe rest of the content."
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "The rest of the content.",
            header: {
                location: "Dark Forest",
                time: "Midnight",
                weather: "Raining",
            },
        })
    })

    it("should return null header if the format doesn't match", () => {
        const text = "[Dark Forest] - [Midnight] - [Raining]\nThe rest of the content."
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "[Dark Forest] - [Midnight] - [Raining]\nThe rest of the content.",
            header: null,
        })
    })

    it("should return empty content and null header for empty input", () => {
        expect(parse_scene_header(null)).toEqual({ content: "", header: null })
        expect(parse_scene_header(undefined)).toEqual({ content: "", header: null })
        expect(parse_scene_header("")).toEqual({ content: "", header: null })
    })

    it("should handle a header with no content after it", () => {
        const text = "『 [Location] · [Time] · [Weather] 』"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "",
            header: {
                location: "Location",
                time: "Time",
                weather: "Weather",
            },
        })
    })

    it("should handle extra whitespace gracefully", () => {
        const text = "『   [ Location ]  ·  [ Time ]  ·  [ Weather ]   』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Content",
            header: {
                location: "Location",
                time: "Time",
                weather: "Weather",
            },
        })
    })

    it("should return null header if header is missing brackets", () => {
        const text = "『 Location · Time · Weather 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 Location · Time · Weather 』\nContent",
            header: null,
        })
    })

    it("should parse a header with empty brackets", () => {
        const text = "『 [] · [] · [] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Content",
            header: {
                location: "",
                time: "",
                weather: "",
            },
        })
    })

    it("should return null header if sections are missing", () => {
        const text = "『 [Location] · [Time] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 [Location] · [Time] 』\nContent",
            header: null,
        })
    })

    it("should return null header if brackets are malformed", () => {
        const text = "『 [Location · [Time] · [Weather] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 [Location · [Time] · [Weather] 』\nContent",
            header: null,
        })
    })

    it("should return null header if the header is not at the start of the text", () => {
        const text = "Some text before 『 [Location] · [Time] · [Weather] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Some text before 『 [Location] · [Time] · [Weather] 』\nContent",
            header: null,
        })
    })

    it("should return null header if there are leading spaces before the header", () => {
        const text = "   『 [Location] · [Time] · [Weather] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "   『 [Location] · [Time] · [Weather] 』\nContent",
            header: null,
        })
    })

    it("should handle unicode and special characters inside brackets", () => {
        const text = "『 [東京 🗼] · [23:00 / 夜] · [嵐 (Storm)] 』\nJapanese Content"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Japanese Content",
            header: {
                location: "東京 🗼",
                time: "23:00 / 夜",
                weather: "嵐 (Storm)",
            },
        })
    })

    it("should return null header if separator is missing or wrong", () => {
        const text = "『 [Location] - [Time] - [Weather] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 [Location] - [Time] - [Weather] 』\nContent",
            header: null,
        })
    })

    it("should return null header for a missing opening bracket", () => {
        const text = "『 [Location] · Time] · [Weather] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 [Location] · Time] · [Weather] 』\nContent",
            header: null,
        })
    })

    it("should return null header if missing closing corner bracket", () => {
        const text = "『 [Location] · [Time] · [Weather] \nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 [Location] · [Time] · [Weather] \nContent",
            header: null,
        })
    })

    it("should handle multiline content in the rest of the text", () => {
        const text = "『 [Location] · [Time] · [Weather] 』\nLine 1\nLine 2\nLine 3"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Line 1\nLine 2\nLine 3",
            header: {
                location: "Location",
                time: "Time",
                weather: "Weather",
            },
        })
    })

    it("should handle brackets containing only spaces", () => {
        const text = "『 [   ] · [   ] · [   ] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Content",
            header: {
                location: "",
                time: "",
                weather: "",
            },
        })
    })

    it("should parse correctly with absolutely no extra spaces around tokens", () => {
        const text = "『[Location]·[Time]·[Weather]』Content"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Content",
            header: {
                location: "Location",
                time: "Time",
                weather: "Weather",
            },
        })
    })

    it("should return null header if text is just spaces", () => {
        const text = "    "
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "    ",
            header: null,
        })
    })

    it("should return null header if one bracket is missing entirely", () => {
        const text = "『 [Location] · [Time] ·  』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 [Location] · [Time] ·  』\nContent",
            header: null,
        })
    })
})
