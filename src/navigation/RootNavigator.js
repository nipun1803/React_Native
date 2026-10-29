import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './Tabnavigator';
import ConversationScreen from '../screens/ConversationScreen';
import NewConversationModal from '../screens/NewConversationModal';
import DetailsScreen from '../screens/Detailsscreen';
import ApiStateScreen from '../screens/ApiStateScreen';
import ApiReactQueryScreen from '../screens/ApiReactQueryScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NewConversation"
        component={NewConversationModal}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Lab screens */}
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="ApiState" component={ApiStateScreen} />
      <Stack.Screen name="ApiReactQuery" component={ApiReactQueryScreen} />
    </Stack.Navigator>
  );
}
