import Logo from '../icons/main_logo.svg';
import { TopsideInstruments } from './topside';
import { Sidemenu } from './sidemenu';
import './mainframe.css'
import { useEffect, useRef, useState } from 'react';

export const Mainframe = () => {
    const sidemenu = useRef(null)
    const mainLogo = useRef(null)

    const [sideBoxHeight, setSideBoxHeight] = useState('100%')
    const [sideBoxPadding, setSideBoxPadding] = useState('100px')

    useEffect(() => {
        const handleLogoResize = () => {
            setSideBoxHeight(`${sidemenu.current.clientHeight - mainLogo.current.height}px`);
            setSideBoxPadding(`${mainLogo.current.height}px`)
        }

        window.addEventListener('resize', handleLogoResize)

        return () => {window.removeEventListener('resize', handleLogoResize)}
    }, [])

    return (
        <div className='main'>
            <div id='topside'>
                <TopsideInstruments/>
            </div>
            <div id='sidemenu' ref={sidemenu}>
                <img id='main_logo' ref={mainLogo} src={Logo} alt='Logo for WP'/>
                <div id='logo_box' />
                <div id='sidemenu_box' style={{height: sideBoxHeight, paddingTop: sideBoxPadding}}>
                    <Sidemenu />
                </div>
            </div> 
        </div>
    )
}
