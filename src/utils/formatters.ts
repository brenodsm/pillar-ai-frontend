import type { Minutes, ProcessResult } from "../types";

export function formatMinutesToAta(minutes: Minutes): string {
  let ata = `ATA DE REUNIÃO\n\n`;
  ata += `Reunião: ${minutes.title}\n`;
  ata += `Data: ${minutes.date}\n`;
  if (minutes.participants.length > 0) {
    ata += `Participantes: ${minutes.participants.join(", ")}\n`;
  }
  ata += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (minutes.summary) {
    ata += `RESUMO\n${minutes.summary}\n\n`;
  }

  if (minutes.topics.length > 0) {
    ata += `TÓPICOS DISCUTIDOS\n\n`;
    minutes.topics.forEach((topic, i) => {
      ata += `${i + 1}. ${topic.title}\n`;
      ata += `   ${topic.discussion}\n\n`;
    });
  }

  if (minutes.action_items.length > 0) {
    ata += `AÇÕES DEFINIDAS\n\n`;
    minutes.action_items.forEach((item) => {
      ata += `• ${item.responsible} — ${item.description}`;
      if (item.deadline) ata += ` (prazo: ${item.deadline})`;
      ata += `\n`;
    });
    ata += `\n`;
  }

  if (minutes.decisions.length > 0) {
    ata += `DECISÕES\n\n`;
    minutes.decisions.forEach((d) => {
      ata += `• ${d}\n`;
    });
    ata += `\n`;
  }

  if (minutes.next_steps) {
    ata += `PRÓXIMOS PASSOS\n${minutes.next_steps}\n`;
  }

  return ata;
}

export function formatTranscription(result: ProcessResult): string {
  if (result.transcription.segments && result.transcription.segments.length > 0) {
    return result.transcription.segments.map((seg) => seg.text.trim()).join(" ");
  }
  return result.transcription.text;
}
