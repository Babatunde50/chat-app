const socket = io()

// Elements
const $messageForm = document.querySelector('#form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplates = document.querySelector('#message-template').innerHTML
const locationTemplates = document.querySelector('#location-template').innerHTML
const sidebarTemplates = document.querySelector('#sidebar-templates').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
     // New Message element
     const $newMessage = $messages.lastElementChild

     // Height of the new message
     const newMessageStyles = getComputedStyle($newMessage)
     const newMessageMargin = parseInt(newMessageStyles.marginBottom)
     const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

     // Visible Height
     const visibleHeight = $messages.offsetHeight

     // Height of messages container
     const containerHeight = $messages.scrollHeight

     // How far have I scrolled?
     const scrollOffset = $messages.scrollTop + visibleHeight

     if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
     }
}

socket.on('message', ({ username, text, createdAt }) => {
    //console.log(message)
    const html = Mustache.render(messageTemplates, {
        username,
        message: text,
        createdAt: moment(createdAt).format('h:mm a') 
    } )
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
} )

socket.on('locationMessage', ({ username, url, createdAt }) => {
    console.log(url)
    const html = Mustache.render(locationTemplates, {
        username,
        url,
        createdAt: moment(createdAt).format('h:mm a') 
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplates, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) {
            return console.log(error)
        }
        console.log('Message Delivered!!!')
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
             longitude: position.coords.longitude
        }, () => {
            console.log('Location Shared!')
            $locationButton.removeAttribute('disabled')
        } )
    })

})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})