export abstract class MailAbstractClass {
    abstract sendMail(data: any): Promise<any>;
}
