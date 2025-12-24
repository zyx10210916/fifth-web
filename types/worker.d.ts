declare module '*.ts?worker' {
    const workFactory: new() => Worker;
    export default workFactory;
}