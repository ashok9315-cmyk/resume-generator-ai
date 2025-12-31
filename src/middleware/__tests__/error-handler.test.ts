import { UserError, SystemError, AIError, handleError } from "../error-handler";
import { NextResponse } from "next/server";

describe("Error Handler", () => {
  describe("UserError", () => {
    it("should create a user error with status 400", () => {
      const error = new UserError("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe("USER_ERROR");
      expect(error.message).toBe("Invalid input");
    });
  });

  describe("SystemError", () => {
    it("should create a system error with status 500", () => {
      const error = new SystemError("System failure");
      expect(error.statusCode).toBe(500);
      expect(error.errorType).toBe("SYSTEM_ERROR");
      expect(error.message).toBe("System failure");
    });
  });

  describe("AIError", () => {
    it("should create an AI error with status 502", () => {
      const error = new AIError("AI service unavailable");
      expect(error.statusCode).toBe(502);
      expect(error.errorType).toBe("AI_ERROR");
      expect(error.message).toBe("AI service unavailable");
    });
  });

  describe("handleError", () => {
    it("should handle UserError correctly", () => {
      const error = new UserError("Invalid input");
      const response = handleError(error, "test-request-id");

      expect(response).toBeInstanceOf(NextResponse);
      // In a real test, you'd check the response body
    });

    it("should handle generic Error", () => {
      const error = new Error("Generic error");
      const response = handleError(error, "test-request-id");

      expect(response).toBeInstanceOf(NextResponse);
    });

    it("should handle unknown error types", () => {
      const error = "String error";
      const response = handleError(error, "test-request-id");

      expect(response).toBeInstanceOf(NextResponse);
    });
  });
});


