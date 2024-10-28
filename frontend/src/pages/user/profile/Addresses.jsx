import { Plus } from 'lucide-react'
import Alert from '../../../components/feedback/Alert'
import UserCard from '../../../components/user/UserCard'

export default function Addresses() {
  return (
    <UserCard 
      title="My Addresses" 
      short_description="Manage your addresses" 
      hasAction={true} 
      actionName="Add Address"
      ActionIcon={Plus}
      onAction={() => console.log('Add address clicked')}
    >
      <Alert 
        type="warning" 
        title="Add Complete Address" 
        message="You have not added any addresses yet." 
      />
    </UserCard>
  )
}
