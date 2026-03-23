import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router } from '@angular/router'; // <--- IMPORT NOU
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent {
  private apiService = inject(ApiService);
  private router = inject(Router); // <--- INJECTAM ROUTERUL

  isOpen = false;
  userMessage = '';

  messages: { text: string, sender: 'user' | 'bot' }[] = [
    { text: 'Salut! Eu sunt AcademiAI, asistentul tau virtual. Cu ce te pot ajuta?', sender: 'bot' }
  ];

  isTyping = false;

  toggleChat() {
    this.isOpen = !this.isOpen;

    // Daca fereastra tocmai s-a inchis (adica isOpen a devenit false), resetam conversatia
    if (!this.isOpen) {
      this.resetChat();
    }
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    const msgToSend = this.userMessage;
    this.messages.push({ text: msgToSend, sender: 'user' });
    this.userMessage = '';

    // 1. Pornim animatia de "Gandire"
    this.isTyping = true;
    this.scrollToBottom();

    // 2. Trimitem la Backend
    this.apiService.sendMessageToAI(msgToSend).subscribe({
      next: (res: any) => {

        // 3. Intarziere artificiala (1 secunda) ca sa vedem animatia cool
        setTimeout(() => {
          this.isTyping = false;
          this.messages.push({ text: res.response, sender: 'bot' });
          this.scrollToBottom();

          // 4. VERIFICAM DACA AVEM ACTIUNE DE NAVIGARE
          if (res.action) {
            this.handleAction(res.action);
          }

        }, 1000); // 1000ms delay
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({ text: 'Eroare conexiune server.', sender: 'bot' });
      }
    });
  }

  // Functia care executa comenzile
  handleAction(action: string) {
    console.log("Execut actiunea:", action);

    switch (action) {
      case 'nav_home':
        this.router.navigate(['/']);
        break;
      case 'nav_members':
        this.router.navigate(['/members']);
        break;
      case 'nav_messages':
        this.router.navigate(['/messages']);
        break;
      case 'nav_profile':
        // Luam username-ul din localStorage
        const userString = localStorage.getItem('user');
        if (userString) {
          const user = JSON.parse(userString);
          this.router.navigate(['/members', user.username]);
        } else {
          this.messages.push({ text: "Trebuie să fii logat pentru a vedea profilul.", sender: 'bot' });
        }
        break;
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatBody = document.querySelector('.chat-body');
      if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }, 100);
  }
  // NOU: Functia care sterge istoricul si lasa doar mesajul de salut
  resetChat() {
    this.messages = [
      { text: 'Salut! Eu sunt AcademiAI, asistentul tau virtual. Cu ce te pot ajuta?', sender: 'bot' }
    ];
  }
}
