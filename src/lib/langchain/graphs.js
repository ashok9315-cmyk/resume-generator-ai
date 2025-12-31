"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverLetterGenerator = exports.ResumeGenerator = void 0;
const langgraph_1 = require("@langchain/langgraph");
const traceable_1 = require("langsmith/traceable");
const winston_1 = __importDefault(require("../logging/winston"));
const chains_1 = require("./chains");
let ResumeGenerator = (() => {
    let _classDecorators = [(0, traceable_1.traceable)({ name: "resume-workflow", run_type: "chain" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ResumeGenerator = _classThis = class {
        constructor() {
            this.graph = this.buildGraph();
        }
        buildGraph() {
            const workflow = new langgraph_1.StateGraph({
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
                winston_1.default.info("Analyzing resume", { requestId: state.requestId });
                const chain = (0, chains_1.createResumeAnalysisChain)();
                const result = await chain.invoke({
                    resumeText: state.rawText,
                });
                const sections = JSON.parse(result);
                winston_1.default.info("Resume analyzed", {
                    requestId: state.requestId,
                    sectionsFound: Object.keys(sections).length,
                });
                return { ...state, sections };
            });
            // Node 2: Optimize for ATS
            workflow.addNode("optimize", async (state) => {
                winston_1.default.info("Optimizing for ATS", { requestId: state.requestId });
                const chain = (0, chains_1.createResumeOptimizationChain)();
                const optimized = await chain.invoke({
                    sections: JSON.stringify(state.sections),
                });
                winston_1.default.info("ATS optimization complete", {
                    requestId: state.requestId,
                });
                return { ...state, optimized };
            });
            // Node 3: Format HTML
            workflow.addNode("format", async (state) => {
                winston_1.default.info("Formatting HTML", { requestId: state.requestId });
                const chain = (0, chains_1.createResumeFormatChain)();
                const formatted = await chain.invoke({
                    optimizedContent: state.optimized,
                });
                winston_1.default.info("HTML formatting complete", { requestId: state.requestId });
                return { ...state, formatted };
            });
            // Define edges
            workflow.addEdge("analyze", "optimize");
            workflow.addEdge("optimize", "format");
            workflow.addEdge("format", langgraph_1.END);
            workflow.setEntryPoint("analyze");
            return workflow.compile();
        }
        async generate(rawText, requestId) {
            const initialState = {
                rawText,
                sections: {},
                optimized: "",
                formatted: "",
                requestId,
            };
            const result = await this.graph.invoke(initialState);
            return result.formatted;
        }
    };
    __setFunctionName(_classThis, "ResumeGenerator");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ResumeGenerator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ResumeGenerator = _classThis;
})();
exports.ResumeGenerator = ResumeGenerator;
let CoverLetterGenerator = (() => {
    let _classDecorators = [(0, traceable_1.traceable)({ name: "cover-letter-workflow", run_type: "chain" })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CoverLetterGenerator = _classThis = class {
        constructor() {
            this.graph = this.buildGraph();
        }
        buildGraph() {
            const workflow = new langgraph_1.StateGraph({
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
                winston_1.default.info("Matching job description with resume", {
                    requestId: state.requestId,
                });
                const chain = (0, chains_1.createCoverLetterMatchingChain)();
                const analysis = await chain.invoke({
                    jobDescription: state.jobDescription,
                    resumeText: state.resumeText,
                });
                winston_1.default.info("Matching complete", { requestId: state.requestId });
                return { ...state, analysis };
            });
            // Node 2: Personalize
            workflow.addNode("personalize", async (state) => {
                winston_1.default.info("Personalizing cover letter", { requestId: state.requestId });
                const chain = (0, chains_1.createCoverLetterPersonalizationChain)();
                const personalized = await chain.invoke({
                    jobDescription: state.jobDescription,
                    analysis: state.analysis,
                    tone: state.tone || "professional",
                    length: state.length || "medium",
                });
                winston_1.default.info("Personalization complete", { requestId: state.requestId });
                return { ...state, personalized };
            });
            // Node 3: Refine
            workflow.addNode("refine", async (state) => {
                winston_1.default.info("Refining cover letter", { requestId: state.requestId });
                const chain = (0, chains_1.createCoverLetterRefinementChain)();
                const refined = await chain.invoke({
                    coverLetter: state.personalized,
                    tone: state.tone || "professional",
                    length: state.length || "medium",
                });
                winston_1.default.info("Refinement complete", { requestId: state.requestId });
                return { ...state, refined };
            });
            // Define edges
            workflow.addEdge("match", "personalize");
            workflow.addEdge("personalize", "refine");
            workflow.addEdge("refine", langgraph_1.END);
            workflow.setEntryPoint("match");
            return workflow.compile();
        }
        async generate(jobDescription, resumeText, tone, length, requestId) {
            const initialState = {
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
    };
    __setFunctionName(_classThis, "CoverLetterGenerator");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CoverLetterGenerator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CoverLetterGenerator = _classThis;
})();
exports.CoverLetterGenerator = CoverLetterGenerator;
