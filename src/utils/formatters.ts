import type { Minutes, ProcessResult } from "../types";
import { formatDateToBrDate } from "./dateFormat";

function formatMeetingDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeResponsibleLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function formatMinutesToAta(minutes: Minutes): string {
  let ata = `Ata de reunião\n\n`;
  ata += `Reunião: ${minutes.title}\n`;
  ata += `Data: ${formatMeetingDate(minutes.date)}\n`;
  if (minutes.participants.length > 0) {
    ata += `Participantes: ${minutes.participants.join(", ")}\n`;
  }
  ata += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (minutes.summary) {
    ata += `Resumo\n${minutes.summary}\n\n`;
  }

  if (minutes.topics.length > 0) {
    ata += `Tópicos discutidos\n\n`;
    minutes.topics.forEach((topic, i) => {
      ata += `• ${topic.title}\n`;
      if (topic.discussion.trim()) {
        ata += `${topic.discussion.trim()}\n`;
      }
      if (i < minutes.topics.length - 1) {
        ata += `\n`;
      }
    });
    ata += `\n\n`;
  }

  if (minutes.action_items.length > 0) {
    ata += `Ações definidas\n\n`;
    minutes.action_items.forEach((item) => {
      const responsible = normalizeResponsibleLabel(item.responsible || "");
      ata += `• Responsável: ${responsible || "Sem responsável"}\n`;
      ata += `  Ação: ${item.description}\n`;
      if (item.deadline) {
        ata += `  Prazo: ${formatDateToBrDate(item.deadline)}\n`;
      }
      ata += `\n`;
    });
    ata += `\n`;
  }

  if (minutes.decisions.length > 0) {
    ata += `Decisões\n\n`;
    minutes.decisions.forEach((d) => {
      ata += `• ${d}\n`;
    });
    ata += `\n`;
  }

  if (minutes.next_steps) {
    ata += `Próximos passos\n${minutes.next_steps}\n`;
  }

  return ata;
}

export function formatTranscription(result: ProcessResult): string {
  if (result.transcription.segments && result.transcription.segments.length > 0) {
    return result.transcription.segments.map((seg) => seg.text.trim()).join(" ");
  }
  return result.transcription.text;
}
