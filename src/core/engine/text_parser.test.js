import { describe, it, expect } from "vitest"
import { parse_scene_header } from "./text_parser.js"

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
})

describe("parse_scene_header additional edge cases", () => {
    it("should handle completely empty header structure without brackets", () => {
        const text = "『 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "『 』\nContent",
            header: null,
        })
    })

    it("should handle headers where inner contents contain the separator character", () => {
        const text = "『 [City · Center] · [12:00] · [Clear] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Content",
            header: {
                location: "City · Center",
                time: "12:00",
                weather: "Clear",
            },
        })
    })

    it("should handle headers where inner contents contain brackets", () => {
        const text = "『 [Area [51]] · [Time [Unknown]] · [Weather [Redacted]] 』\nContent"
        const result = parse_scene_header(text)
        expect(result).toEqual({
            content: "Content",
            header: {
                location: "Area [51]",
                time: "Time [Unknown]",
                weather: "Weather [Redacted]",
            },
        })
    })

    it("should handle different types of whitespace (newlines, tabs) within the header", () => {
        const text = "『\t[\nLocation\n]\t·\t[\tTime\t]\n·\t[\nWeather\n]\t』\nContent"
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

})
