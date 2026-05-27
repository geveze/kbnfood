import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SafeList, SafeTable } from "./SafeList";

describe("SafeList Component", () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should render items with unique keys", () => {
    const items = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
    ];

    render(
      React.createElement(SafeList, {
        items,
        renderItem: (item) => React.createElement("div", null, item.name),
      })
    );

    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Item 2")).toBeDefined();
    expect(screen.getByText("Item 3")).toBeDefined();
  });

  it("should warn on duplicate keys in development", () => {
    const items = [
      { id: 1, name: "Item 1" },
      { id: 1, name: "Item 1 Duplicate" },
    ];

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      React.createElement(SafeList, {
        items,
        renderItem: (item) => React.createElement("div", null, item.name),
      })
    );

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain("Duplicate keys");

    process.env.NODE_ENV = originalEnv;
  });

  it("should use custom keyExtractor", () => {
    const items = [
      { id: 1, name: "Item 1", customKey: "custom-1" },
      { id: 2, name: "Item 2", customKey: "custom-2" },
    ];

    render(
      React.createElement(SafeList, {
        items,
        renderItem: (item) => React.createElement("div", null, item.name),
        keyExtractor: (item) => item.customKey,
      })
    );

    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Item 2")).toBeDefined();
  });

  it("should apply wrapper className", () => {
    const items = [{ id: 1, name: "Item 1" }];

    const { container } = render(
      React.createElement(SafeList, {
        items,
        renderItem: (item) => React.createElement("div", null, item.name),
        className: "test-wrapper",
      })
    );

    const wrapper = container.querySelector(".test-wrapper");
    expect(wrapper).toBeDefined();
  });

  it("should use custom wrapper element", () => {
    const items = [{ id: 1, name: "Item 1" }];

    const { container } = render(
      React.createElement(SafeList, {
        items,
        renderItem: (item) => React.createElement("li", null, item.name),
        wrapper: "ul",
      })
    );

    const wrapper = container.querySelector("ul");
    expect(wrapper).toBeDefined();
  });
});

describe("SafeTable Component", () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("should render table with headers and rows", () => {
    const items = [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 2, name: "User 2", email: "user2@example.com" },
    ];

    const columns = [
      { header: "Name", accessor: "name" as const },
      { header: "Email", accessor: "email" as const },
    ];

    render(
      React.createElement(SafeTable, {
        items,
        columns,
      })
    );

    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("User 1")).toBeDefined();
    expect(screen.getByText("user1@example.com")).toBeDefined();
  });

  it("should render with custom column renderer", () => {
    const items = [
      { id: 1, name: "User 1", score: 95 },
      { id: 2, name: "User 2", score: 87 },
    ];

    const columns = [
      { header: "Name", accessor: "name" as const },
      {
        header: "Score",
        accessor: "score" as const,
        render: (value: number) => `${value}%`,
      },
    ];

    render(
      React.createElement(SafeTable, {
        items,
        columns,
      })
    );

    expect(screen.getByText("95%")).toBeDefined();
    expect(screen.getByText("87%")).toBeDefined();
  });

  it("should warn on duplicate keys in development", () => {
    const items = [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 1, name: "User 1 Duplicate", email: "user1dup@example.com" },
    ];

    const columns = [
      { header: "Name", accessor: "name" as const },
      { header: "Email", accessor: "email" as const },
    ];

    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      React.createElement(SafeTable, {
        items,
        columns,
      })
    );

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain("Duplicate keys");

    process.env.NODE_ENV = originalEnv;
  });

  it("should apply row className", () => {
    const items = [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 2, name: "User 2", email: "user2@example.com" },
    ];

    const columns = [
      { header: "Name", accessor: "name" as const },
      { header: "Email", accessor: "email" as const },
    ];

    const { container } = render(
      React.createElement(SafeTable, {
        items,
        columns,
        rowClassName: "test-row",
      })
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(2);
    rows.forEach((row) => {
      expect(row.classList.contains("test-row")).toBe(true);
    });
  });

  it("should apply dynamic row className", () => {
    const items = [
      { id: 1, name: "User 1", email: "user1@example.com" },
      { id: 2, name: "User 2", email: "user2@example.com" },
    ];

    const columns = [
      { header: "Name", accessor: "name" as const },
      { header: "Email", accessor: "email" as const },
    ];

    const { container } = render(
      React.createElement(SafeTable, {
        items,
        columns,
        rowClassName: (item, index) =>
          index === 0 ? "first-row" : "other-row",
      })
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows[0].classList.contains("first-row")).toBe(true);
    expect(rows[1].classList.contains("other-row")).toBe(true);
  });
});
