import { StateGraph, END } from "@langchain/langgraph";
import { traceable } from "langsmith/traceable";
import logger from "../logging/winston";
import {
  createResumeAnalysisChain,
  createResumeOptimizationChain,
  createResumeFormatChain,
  createCoverLetterMatchingChain,
  createCoverLetterPersonalizationChain,
  createCoverLetterRefinementChain,
} from "./chains";

export interface ResumeState {
  rawText: string;
  sections: Record<string, unknown>;
  optimized: string;
  formatted: string;
  requestId: string;
}

export interface CoverLetterState {
  jobDescription: string;
  resumeText: string;
  analysis: string;
  personalized: string;
  refined: string;
  tone: string;
  length: string;
  requestId: string;
}

// @ts-ignore - traceable decorator type issue
@traceable({ name: "resume-workflow", run_type: "chain" })
export class ResumeGenerator {
  private graph: StateGraph<ResumeState>;

  constructor() {
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph<ResumeState>({
      channels: {
        rawText: null,
        sections: null,
        optimized: null,
        formatted: null,
        requestId: null,
      },
    });

    // Node 1: Analyze Resume
    workflow.addNode("analyze", async (state) => {
      logger.info("Analyzing resume", { requestId: state.requestId });

      const chain = createResumeAnalysisChain();
      const result = await chain.invoke({
        resumeText: state.rawText,
      });

      const sections = JSON.parse(result);

      logger.info("Resume analyzed", {
        requestId: state.requestId,
        sectionsFound: Object.keys(sections).length,
      });

      return { ...state, sections };
    });

    // Node 2: Optimize for ATS
    workflow.addNode("optimize", async (state) => {
      logger.info("Optimizing for ATS", { requestId: state.requestId });

      const chain = createResumeOptimizationChain();
      const optimized = await chain.invoke({
        sections: JSON.stringify(state.sections),
      });

      logger.info("ATS optimization complete", {
        requestId: state.requestId,
      });

      return { ...state, optimized };
    });

    // Node 3: Format HTML
    workflow.addNode("format", async (state) => {
      logger.info("Formatting HTML", { requestId: state.requestId });

      const chain = createResumeFormatChain();
      const formatted = await chain.invoke({
        optimizedContent: state.optimized,
      });

      logger.info("HTML formatting complete", { requestId: state.requestId });

      return { ...state, formatted };
    });

    // Define edges
    workflow.addEdge("analyze", "optimize");
    workflow.addEdge("optimize", "format");
    workflow.addEdge("format", END);

    workflow.setEntryPoint("analyze");

    return workflow.compile();
  }

  async generate(rawText: string, requestId: string): Promise<string> {
    const initialState: ResumeState = {
      rawText,
      sections: {},
      optimized: "",
      formatted: "",
      requestId,
    };

    const result = await this.graph.invoke(initialState);
    return result.formatted;
  }
}

@traceable({ name: "cover-letter-workflow", run_type: "chain" })
export class CoverLetterGenerator {
  private graph: StateGraph<CoverLetterState>;

  constructor() {
    this.graph = this.buildGraph();
  }

  private buildGraph() {
    const workflow = new StateGraph<CoverLetterState>({
      channels: {
        jobDescription: null,
        resumeText: null,
        analysis: null,
        personalized: null,
        refined: null,
        tone: null,
        length: null,
        requestId: null,
      },
    });

    // Node 1: Match job description with resume
    workflow.addNode("match", async (state) => {
      logger.info("Matching job description with resume", {
        requestId: state.requestId,
      });

      const chain = createCoverLetterMatchingChain();
      const analysis = await chain.invoke({
        jobDescription: state.jobDescription,
        resumeText: state.resumeText,
      });

      logger.info("Matching complete", { requestId: state.requestId });

      return { ...state, analysis };
    });

    // Node 2: Personalize
    workflow.addNode("personalize", async (state) => {
      logger.info("Personalizing cover letter", { requestId: state.requestId });

      const chain = createCoverLetterPersonalizationChain();
      const personalized = await chain.invoke({
        jobDescription: state.jobDescription,
        analysis: state.analysis,
        tone: state.tone || "professional",
        length: state.length || "medium",
      });

      logger.info("Personalization complete", { requestId: state.requestId });

      return { ...state, personalized };
    });

    // Node 3: Refine
    workflow.addNode("refine", async (state) => {
      logger.info("Refining cover letter", { requestId: state.requestId });

      const chain = createCoverLetterRefinementChain();
      const refined = await chain.invoke({
        coverLetter: state.personalized,
        tone: state.tone || "professional",
        length: state.length || "medium",
      });

      logger.info("Refinement complete", { requestId: state.requestId });

      return { ...state, refined };
    });

    // Define edges
    workflow.addEdge("match", "personalize");
    workflow.addEdge("personalize", "refine");
    workflow.addEdge("refine", END);

    workflow.setEntryPoint("match");

    return workflow.compile();
  }

  async generate(
    jobDescription: string,
    resumeText: string,
    tone: string,
    length: string,
    requestId: string
  ): Promise<string> {
    const initialState: CoverLetterState = {
      jobDescription,
      resumeText,
      analysis: "",
      personalized: "",
      refined: "",
      tone,
      length,
      requestId,
    };

    const result = await this.graph.invoke(initialState);
    return result.refined;
  }
}


