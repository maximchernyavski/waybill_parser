import { Typography } from "antd"
import { useEffect, useState } from "react"

export const ActiveText = (props) => {
    const [color, setColor] = useState('black')
    const [disabledState, setDisabledState] = useState(false)

    let defaultStyle = {color:{color}, fontSize:'10pt'}

    if (props?.disabled) {
        setDisabledState(props.disabled)
    }

    if (props?.style) {
        defaultStyle = props.style
        setColor(defaultStyle.color)
    }

    useEffect(() => {
        console.log(disabledState)
        if(disabledState) {
            setColor('gray')
        } else {
            setColor('black')
        }
    }, [disabledState])

    return (
        <Typography.Text style={defaultStyle} disabled={disabledState}>
            {props.children}
        </Typography.Text>
    )
}