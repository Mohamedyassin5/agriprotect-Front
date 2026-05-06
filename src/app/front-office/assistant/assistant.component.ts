import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, MessageHistory } from './assistant.service';
import { ActivatedRoute } from '@angular/router';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: Date;
}

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.css']
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  private assistantService = inject(AssistantService);
  private route = inject(ActivatedRoute);

  sessions: ChatSession[] = [];
  activeSessionId: string = '';
  
  editingSessionId: string | null = null;
  editingTitle: string = '';

  currentInput: string = '';
  isLoading: boolean = false;

  get activeSession(): ChatSession | undefined {
    return this.sessions.find(s => s.id === this.activeSessionId);
  }

  ngOnInit() {
    this.loadSessions();
    this.handleQueryParams();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  startEditingTitle(event: Event, session: ChatSession) {
    event.stopPropagation();
    this.editingSessionId = session.id;
    this.editingTitle = session.title;
  }

  saveTitle(session: ChatSession) {
    if (this.editingTitle.trim()) {
      session.title = this.editingTitle.trim();
      this.saveSessions();
    }
    this.cancelEditingTitle();
  }

  cancelEditingTitle() {
    this.editingSessionId = null;
    this.editingTitle = '';
  }

  private loadSessions() {
    const saved = localStorage.getItem('agri_assistant_sessions');
    if (saved) {
      this.sessions = JSON.parse(saved);
      // Convert string dates back to Date objects
      this.sessions.forEach(s => {
        s.lastUpdate = new Date(s.lastUpdate);
        s.messages.forEach(m => m.timestamp = new Date(m.timestamp));
      });
      if (this.sessions.length > 0) {
        this.activeSessionId = this.sessions[0].id;
      }
    }
    
    if (this.sessions.length === 0) {
      this.createNewChat();
    }
  }

  private saveSessions() {
    localStorage.setItem('agri_assistant_sessions', JSON.stringify(this.sessions));
  }

  private handleQueryParams() {
    const initialMessage = this.route.snapshot.queryParamMap.get('message');
    if (initialMessage) {
      // Create a fresh chat for contextual questions from crops
      const newSession = this.createNewChat('Crop Analysis');
      this.activeSessionId = newSession.id;
      this.currentInput = initialMessage;
      setTimeout(() => this.sendMessage(), 500);
    }
  }

  createNewChat(title: string = 'New Conversation'): ChatSession {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: title,
      messages: [
        {
          role: 'assistant',
          content: 'Hello! I am your AgriProtect Assistant. How can I help you with your farm today?',
          timestamp: new Date()
        }
      ],
      lastUpdate: new Date()
    };
    this.sessions.unshift(newSession);
    this.activeSessionId = newSession.id;
    this.saveSessions();
    return newSession;
  }

  selectSession(id: string) {
    this.activeSessionId = id;
  }

  deleteSession(event: Event, id: string) {
    event.stopPropagation();
    this.sessions = this.sessions.filter(s => s.id !== id);
    if (this.activeSessionId === id) {
      this.activeSessionId = this.sessions.length > 0 ? this.sessions[0].id : '';
    }
    if (this.sessions.length === 0) {
      this.createNewChat();
    }
    this.saveSessions();
  }

  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  sendMessage() {
    if (!this.currentInput.trim() || !this.activeSession) return;

    const session = this.activeSession;
    const userMessage = this.currentInput.trim();
    
    // Set first message as title if default
    if (session.title === 'New Conversation') {
      session.title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
    }

    session.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    this.currentInput = '';
    this.isLoading = true;
    session.lastUpdate = new Date();

    const history: MessageHistory[] = session.messages
      .slice(0, -1)
      .map(msg => ({ role: msg.role, content: msg.content }));

    this.assistantService.chat({ message: userMessage, history }).subscribe({
      next: (response) => {
        session.messages.push({
          role: 'assistant',
          content: response.answer,
          timestamp: new Date()
        });
        session.lastUpdate = new Date();
        this.isLoading = false;
        this.saveSessions();
      },
      error: (err) => {
        console.error('Chat error:', err);
        session.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        });
        this.isLoading = false;
        this.saveSessions();
      }
    });
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
