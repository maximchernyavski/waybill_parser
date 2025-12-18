import Logo from '../icons/main_logo.svg';
import { TopsideInstruments } from './topside';
import { Sidemenu } from './sidemenu';
import './mainframe.css'
// import { useEffect, useRef, useState } from 'react';

export const Mainframe = () => {
    // const sidemenu = useRef(null)
    // const mainLogo = useRef(null)

    // const [sideBoxHeight, setSideBoxHeight] = useState('100%')
    // const [sideBoxPadding, setSideBoxPadding] = useState('5%')

    // useEffect(() => {
    //     const handleLogoResize = () => {
    //         setSideBoxHeight(`${sidemenu.current.clientHeight - mainLogo.current.height}px`);
    //         setSideBoxPadding(`${mainLogo.current.height}px`)
    //     }

    //     window.addEventListener('resize', handleLogoResize)

    //     console.log("Recalc", sidemenu.current.clientHeight, mainLogo.current.height) 

    //     return () => {window.removeEventListener('resize', handleLogoResize)}
    // }, [])

    return (
        <div className='main'>
            <div id='topside'>
                <TopsideInstruments/>
            </div>
            <div id='sidemenu' /*ref={sidemenu}*/>
                <div id='logo_box'>
                    <img id='main_logo' /*ref={mainLogo}*/ src={Logo} alt='Logo for WP'/>
                </div>
                <div id='sidemenu_box' /*style={{height: sideBoxHeight, paddingTop: sideBoxPadding}}*/>
                    <Sidemenu />
                </div>
            </div> 
        </div>
    )
}
