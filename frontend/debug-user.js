// Debug helper - check what's in localStorage
const user = JSON.parse(localStorage.getItem('user'));
console.log('User object:', user);
console.log('Available fields:', Object.keys(user || {}));

// Log the user object structure to help debug
if (user) {
    console.log('User ID (_id):', user._id);
    console.log('Profile ID:', user.profileId);
    console.log('Role:', user.role);
}
