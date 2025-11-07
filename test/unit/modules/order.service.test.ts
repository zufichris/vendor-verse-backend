import { NewsletterService } from '../../../src/modules/newsletter/newsletter.service'
import { CreateOrderDto, OrderRepository, OrderService, PaymentService } from '../../../src/modules/order/'
import { ProductService } from '../../../src/modules/product'
import { UserStatus, User, UserService } from '../../../src/modules/user'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test', debug: true })

describe('OrderService', () => {
    let orderSevice: OrderService

    beforeEach(() => {
        orderSevice = new OrderService({} as OrderRepository, {} as UserService, {} as ProductService, {} as PaymentService, {} as NewsletterService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('createOrder', () => {
        const createDto: CreateOrderDto = {
            items: [],
            shipping: 0,
            tax: 0,
            shippingAddress: {
                city: 'test',
                country: 'test',
                email: 'testuser@email.com',
                firstName: 'test',
                lastName: 'user',
                phone: '1234567890',
                postalCode: '0000',
                state: 'test state',
                street: '123 test st'
            },
            currency: 'aed',
            newsletter: false,
            paymentMethod: 'cod'
        }
        beforeEach(() => {
            jest.clearAllMocks()
        })
        it('should create an order', async () => {
            orderSevice['userService'].getUserProfile = jest.fn().mockResolvedValueOnce({ id: 'test-user-id', status: UserStatus.ACTIVE } as unknown as User)
            orderSevice['orderRepo'].create = jest.fn().mockResolvedValue({ id: 'order-id' })
            orderSevice['reserveStock'] = jest.fn()
            const result = await orderSevice.createOrder(createDto, 'test-user-id')
            expect(result).toEqual({ id: 'order-id' })
            expect(orderSevice['orderRepo'].create).toHaveBeenCalledTimes(1)
            expect(orderSevice['reserveStock']).toHaveBeenCalledTimes(1)
        })
        it('should test-user-id not found', async () => {
            orderSevice['userService'].getUserProfile = jest.fn().mockResolvedValue(null)
            await expect(orderSevice.createOrder(createDto, 'test-user-id')).rejects.toThrow("account not found")
            expect(orderSevice['userService'].getUserProfile).toHaveBeenCalledTimes(1)
        })
        it('should throw throw error if user is suspended or inactive', async () => {
            orderSevice['userService'].getUserProfile = jest.fn().mockResolvedValue({ status: UserStatus.BANNED, } as unknown as User)
            await expect(orderSevice.createOrder(createDto, 'test-user-id')).rejects.toThrow('account suspended or inactive, your cannot make purchases')
            expect(orderSevice['userService'].getUserProfile).toHaveBeenCalledTimes(1)
        })
        //TODO: add more tests
    })
})
