/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        card: "var(--card)",
        primary: "var(--primary)",
        success: "var(--success)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-task": "var(--accent-task)",
        warning: "var(--warning)",
      },
    },
  },
  plugins: [],
};
