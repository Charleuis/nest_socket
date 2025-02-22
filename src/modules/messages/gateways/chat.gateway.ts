import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { JwtUserPayload } from 'src/common/interface/jwt-user-payload';
import { CreateChatDto } from '../dto/create-chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {    
    console.log('New client attempting to connect...');
    console.log('Client ID:', client.id);
    console.log('Query parameters:', client.handshake.query);

    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedClients.set(userId, client);
      client.join(`user_${userId}`);
      console.log(`Client connected successfully - User ID: ${userId}`);
      console.log(`Total connected clients: ${this.connectedClients.size}`);
      
      // Emit welcome message to the connected client
      client.emit('connectionStatus', { 
        status: 'connected', 
        message: `Successfully connected with ID: ${client.id}` 
      });
    } else {
      console.log('Connection rejected - No userId provided');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnecting...');
    console.log('Client ID:', client.id);
    
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedClients.delete(userId);
      console.log(`Client disconnected - User ID: ${userId}`);
      console.log(`Remaining connected clients: ${this.connectedClients.size}`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { createChatDto: CreateChatDto, user: JwtUserPayload }
  ) {
    console.log('Received message event');
    console.log('From client ID:', client.id);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    try {
      const { createChatDto, user } = payload;
      const result = await this.chatService.sendMessage(createChatDto, user);

      console.log('Message processing result:', JSON.stringify(result, null, 2));

      if (result.statusCode === 201) {
        const message = result.data;
        
        // Emit to the specific chat room
        this.server.to(`chat_${createChatDto.chatId}`).emit('newMessage', message);
        console.log(`Message emitted to chat room: chat_${createChatDto.chatId}`);
        
        // If it's a private chat, also emit to the receiver's personal room
        if (createChatDto.receiverId) {
          this.server.to(`user_${createChatDto.receiverId}`).emit('newMessage', message);
          console.log(`Message emitted to user room: user_${createChatDto.receiverId}`);
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing message:', error);
      return { status: 'error', message: 'Failed to send message' };
    }
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string
  ) {
    console.log(`Client ${client.id} joining chat room: ${chatId}`);
    client.join(`chat_${chatId}`);
    console.log(`Client successfully joined chat room: chat_${chatId}`);
    return { status: 'success', message: 'Joined chat room' };
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() chatId: string
  ) {
    console.log(`Client ${client.id} leaving chat room: ${chatId}`);
    client.leave(`chat_${chatId}`);
    console.log(`Client successfully left chat room: chat_${chatId}`);
    return { status: 'success', message: 'Left chat room' };
  }
} 