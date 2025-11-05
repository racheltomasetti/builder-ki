import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import VoiceCaptureComponent from "./VoiceCaptureComponent";

export interface VoiceCaptureOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    voiceCapture: {
      setVoiceCapture: (options: { captureId: string }) => ReturnType;
    };
  }
}

export const VoiceCaptureNode = Node.create<VoiceCaptureOptions>({
  name: "voiceCapture",

  group: "block",

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      captureId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-capture-id"),
        renderHTML: (attributes) => {
          if (!attributes.captureId) {
            return {};
          }
          return {
            "data-capture-id": attributes.captureId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="voice-capture"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "voice-capture" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VoiceCaptureComponent);
  },

  addCommands() {
    return {
      setVoiceCapture:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
