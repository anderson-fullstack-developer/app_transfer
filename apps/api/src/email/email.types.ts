export interface SendEmailInput {
  to: string;
  subject: string;
  /** Corpo em texto simples. HTML pode ser adicionado quando houver provider real. */
  text: string;
}

/** Abstracao de envio de email (doc, seccao 22). O dominio nao conhece o provider. */
export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
