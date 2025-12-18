import { ActiveText } from "../misc/active_text"


export const Sidemenu = () => {
    return (
    <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column'}}>
        <ActiveText disabled={true}>1. Импорт файлов</ActiveText>
        <ActiveText>2. Проверка данных</ActiveText>
        <ActiveText>3. Предпросмотр</ActiveText>
        <ActiveText>4. Экспорт</ActiveText>
    </div>)
}