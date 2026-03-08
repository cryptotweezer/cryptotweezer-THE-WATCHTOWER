import arcjet, { fixedWindow } from "@arcjet/next";

const aj = arcjet({
    key: "mock",
    rules: [fixedWindow({ mode: "LIVE", max: 10, window: "1d", characteristics: ["userId"] })],
});

export async function check() {
    // If characteristics includes "userId", we MUST pass userId in the second argument.
    const decision = await aj.protect({} as any, { userId: "test-id" });
}
