import { Component, afterNextRender, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  navScrolled = false;
  mobileMenuOpen = false;
  showSuccessModal = false;

  contact = {
    name: '',
    email: '',
    subject: 'consulta',
    message: '',
  };

  private readonly document = inject(DOCUMENT);
  private readonly whatsappNumber = '5561995865529';

  private readonly subjectLabels: Record<string, string> = {
    consulta: 'Agendamento de Consulta',
    duvida: 'Dúvida Geral',
    palestra: 'Convite para Palestras',
    outro: 'Outros Assuntos',
  };

  constructor() {
    afterNextRender(() => {
      this.setupScrollListener();
    });
  }

  private setupScrollListener(): void {
    this.document.defaultView?.addEventListener('scroll', () => {
      this.navScrolled = (this.document.defaultView?.scrollY ?? 0) > 20;
    });
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    this.mobileMenuOpen = false;
    const el = this.document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onContactSubmit(event: Event): void {
    event.preventDefault();

    const name = this.contact.name.trim();
    const email = this.contact.email.trim();
    const message = this.contact.message.trim();
    const subjectLabel = this.subjectLabels[this.contact.subject] ?? this.contact.subject;

    if (!name || !email || !message) {
      return;
    }

    const text =
      `Olá, Pryscilla! Meu nome é ${name}. ` +
      `Meu e-mail é ${email}. ` +
      `Assunto: ${subjectLabel}. ` +
      `Mensagem: ${message}`;

    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
    this.document.defaultView?.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    this.showSuccessModal = true;
    this.contact = {
      name: '',
      email: '',
      subject: 'consulta',
      message: '',
    };
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }
}
