export class UserRegisteredEvent {
  constructor(public readonly userId: string, public readonly role: string) {}
}
